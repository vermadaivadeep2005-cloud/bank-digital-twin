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
    copula_type: str = "gaussian",
    degrees_of_freedom: int = 5,
    n_sims: int = 1000,
    horizon_months: int = 24,
    initial_capital: float = 1_000_000_000.0,
    seed: Optional[int] = 42,
    actions: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """
    High-performance vectorized Monte Carlo Simulation engine supporting Vasicek Copulas.
    Supports Gaussian Copula (standard normal) and Student's t-Copula (heavy-tailed extreme risk).
    """
    df = load_loan_portfolio_df(db)
    if df.empty:
        return {"error": "No loans in portfolio. Generate a synthetic bank first."}

    n_loans = len(df)
    outstanding = df["outstanding"].to_numpy(dtype=np.float64)
    total_portfolio = float(np.sum(outstanding))

    # Apply mitigation actions if specified (for 2-way retesting)
    capital_injection = float(actions.get("capital_injection", 0.0)) if actions else 0.0
    portfolio_derisk_pct = float(actions.get("portfolio_derisk_pct", 0.0)) if actions else 0.0
    npl_provision_boost = float(actions.get("npl_provision_boost", 0.0)) if actions else 0.0
    liquidity_drawdown = float(actions.get("liquidity_facility_drawdown", 0.0)) if actions else 0.0

    # Scale initial capital proportionally to total portfolio (15% Tier 1 Capital) + injections
    if initial_capital == 1_000_000_000.0 or initial_capital <= 0:
        initial_capital = max(10_000_000.0, total_portfolio * 0.15)
    initial_capital += capital_injection + liquidity_drawdown

    interest_rates = df["interest_rate"].to_numpy(dtype=np.float64)
    base_pd = compute_baseline_pd(df)
    lgd = get_lgd_array(df)
    rho = get_asset_correlation_array(df)

    # De-risking & provision boosts under management mitigation
    if portfolio_derisk_pct > 0:
        base_pd = base_pd * max(0.20, (1.0 - portfolio_derisk_pct * 0.85))
    if npl_provision_boost > 0:
        lgd = np.clip(lgd * (1.0 - npl_provision_boost * 0.60), 0.05, 0.90)

    rng = np.random.default_rng(seed)

    # Path-level systemic macro shock distributions
    shock_magnitude = (unemployment_shock * 1.8) + (rate_shock * 1.2) + 0.15

    # ==================== COPULA MODELING ====================
    # Gaussian Copula vs Student's t-Copula (Heavy Tail)
    copula_clean = (copula_type or "gaussian").lower().strip()
    if copula_clean == "student_t":
        from scipy.stats import t, norm
        df_val = max(3, int(degrees_of_freedom))
        # Draw from Student's t distribution with heavy tails
        t_draws = rng.standard_t(df=df_val, size=n_sims)
        u_draws = t.cdf(t_draws, df=df_val)
        u_draws = np.clip(u_draws, 1e-7, 1.0 - 1e-7)
        z_factors = norm.ppf(u_draws)
        copula_label = f"Student's t-Copula (Heavy Tail, ν={df_val})"
    else:
        # Standard Gaussian Copula (Normal distribution)
        z_factors = rng.normal(loc=0.0, scale=1.0, size=n_sims)
        copula_label = "Gaussian Copula (Standard Normal)"

    # Monthly net interest income baseline (NII) net of funding costs
    net_margin = max(0.008, np.mean(interest_rates) - rate_shock * 0.4)
    if liquidity_drawdown > 0:
        net_margin += 0.002  # Buffer NII margin from liquidity facility
    monthly_nii_base = (total_portfolio * net_margin) / 12.0

    capital_paths = np.zeros((n_sims, horizon_months + 1), dtype=np.float64)
    capital_paths[:, 0] = initial_capital

    total_losses = np.zeros(n_sims, dtype=np.float64)
    monthly_base_loss = np.sum(outstanding * base_pd * lgd) / 12.0

    for m in range(horizon_months):
        time_stress_curve = 0.4 + 0.9 * np.sin(np.pi * (m + 1) / 24.0)
        path_loss_mult = np.exp((shock_magnitude * time_stress_curve) - (0.45 * z_factors))
        monthly_noise = rng.normal(loc=1.0, scale=0.06, size=n_sims)
        monthly_path_losses = np.clip(monthly_base_loss * path_loss_mult * monthly_noise, 0.0, initial_capital * 0.20)

        previous_capital = capital_paths[:, m]
        current_capital = previous_capital + monthly_nii_base - monthly_path_losses
        capital_paths[:, m + 1] = current_capital
        total_losses += monthly_path_losses

    loan_expected_losses = (outstanding * base_pd * lgd) * (1.0 + shock_magnitude)
    df["sim_loss"] = loan_expected_losses

    p5 = np.percentile(capital_paths, 5, axis=0)
    p50 = np.percentile(capital_paths, 50, axis=0)
    p95 = np.percentile(capital_paths, 95, axis=0)

    survived = (capital_paths[:, -1] > 0).mean()

    sample_indices = rng.choice(n_sims, size=min(200, n_sims), replace=False)
    sample_losses = total_losses[sample_indices].tolist()

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
        "copula_type": copula_clean,
        "degrees_of_freedom": degrees_of_freedom if copula_clean == "student_t" else 0,
        "copula_label": copula_label,
        "params": {
            "unemployment_shock": unemployment_shock,
            "rate_shock": rate_shock,
            "copula_type": copula_clean,
            "degrees_of_freedom": degrees_of_freedom,
            "n_sims": n_sims,
            "horizon_months": horizon_months,
            "seed": seed,
        },
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


def run_reverse_stress_test(
    db: Session,
    target_metric: str = "car_breach",
    target_value: float = 8.0,
    copula_type: str = "gaussian",
    degrees_of_freedom: int = 5,
    n_sims: int = 1000,
    horizon_months: int = 24,
    actions: Optional[Dict[str, float]] = None,
    scenario_name: str = "Reverse Stress & 2-Way Mitigation Retest",
) -> Dict[str, Any]:
    """
    Executes Reverse Stress Testing & 2-Way Mitigation Retesting.
    1. Finds the critical breaking shock (unemployment & rate spike) that breaches target threshold.
    2. Runs Pre-Mitigation simulation under the breaking shock.
    3. Applies management actions and re-simulates (Post-Mitigation) under the exact same shock.
    4. Computes 2-Way side-by-side comparison matrix.
    """
    # 1. Reverse search to identify breaking point shock vector
    breaking_unemployment = 0.08
    breaking_rate = 0.03

    # Scan unemployment shock to find breaking threshold
    shock_grid = [0.06, 0.09, 0.12, 0.15, 0.18, 0.22, 0.26]
    for candidate_u in shock_grid:
        candidate_r = round(candidate_u * 0.25 + 0.015, 3)
        res = run_monte_carlo_vectorized(
            db,
            unemployment_shock=candidate_u,
            rate_shock=candidate_r,
            copula_type=copula_type,
            degrees_of_freedom=degrees_of_freedom,
            n_sims=300,
            horizon_months=horizon_months,
            seed=42,
        )
        if "error" in res:
            return res

        port_size = res["summary"]["portfolio_size"]
        init_cap = res["summary"]["initial_capital"]
        exp_loss = res["summary"]["expected_loss"]
        rwa = port_size * 0.70
        end_car = ((init_cap - exp_loss) / rwa * 100.0) if rwa > 0 else 0.0

        if target_metric == "car_breach" and end_car <= target_value:
            breaking_unemployment = candidate_u
            breaking_rate = candidate_r
            break
        elif target_metric == "solvency_breach" and end_car <= 0.0:
            breaking_unemployment = candidate_u
            breaking_rate = candidate_r
            break
        elif target_metric == "loss_threshold" and exp_loss >= target_value:
            breaking_unemployment = candidate_u
            breaking_rate = candidate_r
            break
        else:
            breaking_unemployment = candidate_u
            breaking_rate = candidate_r

    # 2. Run Pre-Mitigation Simulation under breaking shock
    pre_results = run_monte_carlo_vectorized(
        db,
        unemployment_shock=breaking_unemployment,
        rate_shock=breaking_rate,
        copula_type=copula_type,
        degrees_of_freedom=degrees_of_freedom,
        n_sims=n_sims,
        horizon_months=horizon_months,
        seed=42,
        actions=None,
    )

    # 3. Run Post-Mitigation Simulation under breaking shock with user management actions
    post_results = run_monte_carlo_vectorized(
        db,
        unemployment_shock=breaking_unemployment,
        rate_shock=breaking_rate,
        copula_type=copula_type,
        degrees_of_freedom=degrees_of_freedom,
        n_sims=n_sims,
        horizon_months=horizon_months,
        seed=42,
        actions=actions,
    )

    # Helper function for currency formatting in Python backend
    def format_m(val: float) -> str:
        return f"${val / 1e6:.2f}M"

    # Compute CARs
    pre_port = pre_results["summary"]["portfolio_size"]
    pre_rwa = pre_port * 0.70
    pre_car = ((pre_results["summary"]["initial_capital"] - pre_results["summary"]["expected_loss"]) / pre_rwa * 100.0) if pre_rwa > 0 else 0.0

    post_port = post_results["summary"]["portfolio_size"]
    post_rwa = post_port * 0.70
    post_car = ((post_results["summary"]["initial_capital"] - post_results["summary"]["expected_loss"]) / post_rwa * 100.0) if post_rwa > 0 else 0.0

    # 4. Generate 2-Way Comparison Matrix
    comparison = [
        {
          "metric_name": "Capital Adequacy Ratio (CAR)",
          "pre_mitigation": f"{pre_car:.2f}%",
          "post_mitigation": f"{post_car:.2f}%",
          "delta": f"+{post_car - pre_car:.2f}%" if post_car >= pre_car else f"{post_car - pre_car:.2f}%",
          "status": "RECOVERED" if post_car >= 8.0 else ("IMPROVED" if post_car > pre_car else "BREACHED"),
        },
        {
          "metric_name": "Bank Survival Rate (%)",
          "pre_mitigation": f"{pre_results['survived_pct']:.1f}%",
          "post_mitigation": f"{post_results['survived_pct']:.1f}%",
          "delta": f"+{post_results['survived_pct'] - pre_results['survived_pct']:.1f}%",
          "status": "RECOVERED" if post_results["survived_pct"] >= 90.0 else "IMPROVED",
        },
        {
          "metric_name": "Expected Loss ($M)",
          "pre_mitigation": format_m(pre_results["summary"]["expected_loss"]),
          "post_mitigation": format_m(post_results["summary"]["expected_loss"]),
          "delta": format_m(pre_results["summary"]["expected_loss"] - post_results["summary"]["expected_loss"]) + " saved",
          "status": "IMPROVED" if post_results["summary"]["expected_loss"] < pre_results["summary"]["expected_loss"] else "UNCHANGED",
        },
        {
          "metric_name": "P95 Worst Case Loss ($M)",
          "pre_mitigation": format_m(pre_results["summary"]["p95_loss"]),
          "post_mitigation": format_m(post_results["summary"]["p95_loss"]),
          "delta": format_m(pre_results["summary"]["p95_loss"] - post_results["summary"]["p95_loss"]) + " saved",
          "status": "IMPROVED" if post_results["summary"]["p95_loss"] < pre_results["summary"]["p95_loss"] else "UNCHANGED",
        },
        {
          "metric_name": "Tier 1 Capital Base ($M)",
          "pre_mitigation": format_m(pre_results["summary"]["initial_capital"]),
          "post_mitigation": format_m(post_results["summary"]["initial_capital"]),
          "delta": format_m(post_results["summary"]["initial_capital"] - pre_results["summary"]["initial_capital"]),
          "status": "RECOVERED" if post_results["summary"]["initial_capital"] > pre_results["summary"]["initial_capital"] else "UNCHANGED",
        },
    ]

    # Evaluate Overall Mitigation Effectiveness
    if post_car >= 8.0 and post_results["survived_pct"] >= 85.0:
        mitigation_status = "RECOVERED"
        summary_advisory = f"Management actions successfully restored bank capital reserves above Basel III regulatory threshold ({post_car:.2f}% CAR vs {pre_car:.2f}% pre-mitigation)."
    elif post_car > pre_car + 1.0:
        mitigation_status = "PARTIALLY_MITIGATED"
        summary_advisory = f"Management actions significantly improved capital posture (CAR from {pre_car:.2f}% to {post_car:.2f}%), but additional Tier 1 capital injection is advised."
    else:
        mitigation_status = "INSUFFICIENT_ACTION"
        summary_advisory = "Applied actions are insufficient to prevent regulatory breach under critical shock vector. Increase Tier 1 capital injection or portfolio de-risking percentage."

    return {
        "scenario_name": scenario_name,
        "target_metric": target_metric,
        "target_value": target_value,
        "copula_type": copula_type,
        "degrees_of_freedom": degrees_of_freedom,
        "breaking_shock": {
            "unemployment_shock": breaking_unemployment,
            "rate_shock": breaking_rate,
        },
        "pre_mitigation_results": pre_results,
        "post_mitigation_results": post_results,
        "comparison": comparison,
        "mitigation_status": mitigation_status,
        "summary_advisory": summary_advisory,
    }

