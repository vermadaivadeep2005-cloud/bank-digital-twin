import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.loan import Loan
from app.models.customer import Customer
from app.simulation.credit_model import (
    compute_baseline_pd,
    get_lgd_array,
    get_asset_correlation_array,
)


def load_loan_portfolio_df(db: Session) -> pd.DataFrame:
    """Fetches loan portfolio joins with customer attributes into a Pandas DataFrame."""
    results = (
        db.query(
            Loan.id,
            Loan.outstanding,
            Loan.interest_rate,
            Loan.loan_type,
            Loan.region,
            Loan.status,
            Customer.credit_score,
            Customer.employment_status,
        )
        .join(Customer, Loan.customer_id == Customer.id)
        .all()
    )

    if not results:
        return pd.DataFrame()

    data = [
        {
            "id": str(r[0]),
            "outstanding": float(r[1]),
            "interest_rate": float(r[2]),
            "loan_type": str(r[3]),
            "region": str(r[4]),
            "status": str(r[5]),
            "credit_score": int(r[6]),
            "employment": str(r[7]),
        }
        for r in results
    ]
    return pd.DataFrame(data)


def run_monte_carlo_vectorized(
    db: Session,
    unemployment_shock: float = 0.05,
    rate_shock: float = 0.02,
    n_sims: int = 1000,
    horizon_months: int = 24,
    initial_capital: float = 1_000_000_000.0,
    seed: Optional[int] = 42,
) -> Dict[str, Any]:
    """
    High-performance vectorized Monte Carlo Simulation engine.
    Simulates thousands of macroeconomic and credit loss paths in <500ms.
    """
    df = load_loan_portfolio_df(db)
    if df.empty:
        return {"error": "No loans in portfolio. Generate a synthetic bank first."}

    n_loans = len(df)
    outstanding = df["outstanding"].to_numpy(dtype=np.float64)
    total_portfolio = float(np.sum(outstanding))
    
    # Scale initial capital proportionally to total portfolio (15% Tier 1 Capital)
    if initial_capital == 1_000_000_000.0 or initial_capital <= 0:
        initial_capital = max(10_000_000.0, total_portfolio * 0.15)

    interest_rates = df["interest_rate"].to_numpy(dtype=np.float64)
    base_pd = compute_baseline_pd(df)
    lgd = get_lgd_array(df)
    rho = get_asset_correlation_array(df)

    rng = np.random.default_rng(seed)

    # Path-level systemic macro shock distributions
    # Severity factor scales with unemployment and rate shocks
    shock_magnitude = (unemployment_shock * 1.8) + (rate_shock * 1.2) + 0.15

    # Generate 1000 path-level systemic macro factors Z_i ~ N(0, 1)
    z_factors = rng.normal(loc=0.0, scale=1.0, size=n_sims)

    # Monthly net interest income baseline (NII) net of funding costs
    # High rate_shock increases cost of funds (compressing net margin)
    net_margin = max(0.008, np.mean(interest_rates) - rate_shock * 0.4)
    monthly_nii_base = (total_portfolio * net_margin) / 12.0

    capital_paths = np.zeros((n_sims, horizon_months + 1), dtype=np.float64)
    capital_paths[:, 0] = initial_capital

    total_losses = np.zeros(n_sims, dtype=np.float64)
    monthly_base_loss = np.sum(outstanding * base_pd * lgd) / 12.0

    # Calculate monthly loss multiplier per path i and month m
    # Stress curves over time (peaking around months 6-18)
    for m in range(horizon_months):
        # Time-evolving stress profile: builds up, peaks around m=12-16, then stabilizes
        time_stress_curve = 0.4 + 0.9 * np.sin(np.pi * (m + 1) / 24.0)
        
        # Monthly loss multiplier for path i:
        # Severe negative Z_i paths suffer heavy default spikes
        path_loss_mult = np.exp((shock_magnitude * time_stress_curve) - (0.45 * z_factors))
        
        # Random monthly noise (volatility)
        monthly_noise = rng.normal(loc=1.0, scale=0.06, size=n_sims)
        monthly_path_losses = np.clip(monthly_base_loss * path_loss_mult * monthly_noise, 0.0, initial_capital * 0.20)

        # Net monthly capital change = NII - Monthly Losses
        previous_capital = capital_paths[:, m]
        current_capital = previous_capital + monthly_nii_base - monthly_path_losses
        capital_paths[:, m + 1] = current_capital
        total_losses += monthly_path_losses

    # Loan-level expected losses for segment breakdown
    loan_expected_losses = (outstanding * base_pd * lgd) * (1.0 + shock_magnitude)
    df["sim_loss"] = loan_expected_losses

    # Aggregate percentiles across all 1000 paths (from m=0 to m=24)
    p5 = np.percentile(capital_paths, 5, axis=0)    # Adverse path (bottom 5%)
    p50 = np.percentile(capital_paths, 50, axis=0)  # Median path (50th percentile)
    p95 = np.percentile(capital_paths, 95, axis=0)  # Best case path (top 95th percentile)

    survived = (capital_paths[:, -1] > 0).mean()

    # Histogram sample (downsampled to 200 values for chart)
    sample_indices = rng.choice(n_sims, size=min(200, n_sims), replace=False)
    sample_losses = total_losses[sample_indices].tolist()

    # Segment breakdowns (Losses by loan_type, region)
    segment_by_type = []
    for ltype, group in df.groupby("loan_type"):
        segment_by_type.append({
            "category": str(ltype),
            "expected_loss": float(group["sim_loss"].sum()),
            "loss_pct": float((group["sim_loss"].sum() / group["outstanding"].sum() * 100) if group["outstanding"].sum() > 0 else 0),
        })

    segment_by_region = []
    for reg, group in df.groupby("region"):
        segment_by_region.append({
            "category": str(reg),
            "expected_loss": float(group["sim_loss"].sum()),
            "loss_pct": float((group["sim_loss"].sum() / group["outstanding"].sum() * 100) if group["outstanding"].sum() > 0 else 0),
        })

    summary = {
        "expected_loss": float(np.mean(total_losses)),
        "p5_loss": float(np.percentile(total_losses, 5)),
        "p50_loss": float(np.percentile(total_losses, 50)),
        "p95_loss": float(np.percentile(total_losses, 95)),
        "worst_case_loss": float(np.max(total_losses)),
        "best_case_loss": float(np.min(total_losses)),
        "initial_capital": initial_capital,
        "portfolio_size": float(outstanding.sum()),
        "n_loans": int(n_loans),
    }

    return {
        "scenario_name": "Monte Carlo Stress Test",
        "summary": summary,
        "distribution": sample_losses,
        "capital_paths": {
            "p5": p5.tolist(),
            "p50": p50.tolist(),
            "p95": p95.tolist(),
        },
        "survived_pct": float(survived * 100.0),
        "segment_breakdown": {
            "by_type": segment_by_type,
            "by_region": segment_by_region,
        },
    }
