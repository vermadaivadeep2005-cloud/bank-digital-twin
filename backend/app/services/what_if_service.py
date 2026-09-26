from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.services.kpi_service import compute_kpis
from app.schemas.what_if import BalanceSheetImpact, SensitivityMatrixResponse, FactorSensitivity


def simulate_what_if(
    db: Session,
    unemployment_shock: float = 0.05,
    rate_shock: float = 0.02,
    property_price_drop: float = 0.15,
    deposit_outflow_pct: float = 0.10,
) -> BalanceSheetImpact:
    kpis = compute_kpis(db)

    tot_out = float(kpis.get("total_outstanding", 150_000_000.0))
    if tot_out <= 0:
        tot_out = 150_000_000.0

    capital = float(kpis.get("capital", tot_out * 0.105))
    rwa = float(kpis.get("rwa", tot_out * 0.70))
    baseline_car = float(kpis.get("car", 15.2))
    baseline_npl = min(25.0, float(kpis.get("npl_ratio", 2.5)))
    baseline_liquidity = 120.0

    # Surrogate Loss Response Surface equation
    shock_index = (1.8 * unemployment_shock) + (1.2 * rate_shock) + (0.6 * property_price_drop)
    loss_rate = min(0.35, shock_index * 0.12)
    estimated_losses = tot_out * loss_rate

    # Post-stress metrics
    remaining_capital = capital - estimated_losses
    post_stress_car = (remaining_capital / rwa * 100.0) if rwa > 0 else 0.0
    post_stress_car = max(-5.0, round(float(post_stress_car), 2))

    post_stress_npl = baseline_npl + (unemployment_shock * 60.0) + (rate_shock * 35.0)
    post_stress_npl = min(45.0, round(float(post_stress_npl), 2))

    liquidity_remaining = max(10.0, baseline_liquidity - (deposit_outflow_pct * 160.0))
    liquidity_remaining = round(float(liquidity_remaining), 2)

    required_capital_min = rwa * 0.08
    capital_shortfall = max(0.0, required_capital_min - remaining_capital)
    capital_shortfall = round(float(capital_shortfall), 2)

    # Determine risk level
    if post_stress_car < 6.0 or liquidity_remaining < 80.0:
        risk_level = "Critical"
    elif post_stress_car < 8.0:
        risk_level = "High"
    elif post_stress_car < 10.5:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # Dynamic sensitivities for current shock inputs
    unemp_impact = round((1.8 * unemployment_shock * 0.12 * tot_out / rwa) * 100.0, 2)
    rate_impact = round((1.2 * rate_shock * 0.12 * tot_out / rwa) * 100.0, 2)
    prop_impact = round((0.6 * property_price_drop * 0.12 * tot_out / rwa) * 100.0, 2)
    deposit_impact = round((deposit_outflow_pct * 0.10 * tot_out / rwa) * 100.0, 2)

    sensitivities_list = [
        FactorSensitivity(factor="unemployment_shock", label="Unemployment Rate Shock", impact_pct=max(0.01, unemp_impact)),
        FactorSensitivity(factor="rate_shock", label="Interest Rate Hike", impact_pct=max(0.01, rate_impact)),
        FactorSensitivity(factor="property_price_drop", label="Commercial Property Price Drop", impact_pct=max(0.01, prop_impact)),
        FactorSensitivity(factor="deposit_outflow_pct", label="Deposit Outflow Shock", impact_pct=max(0.01, deposit_impact)),
    ]
    sensitivities_list.sort(key=lambda x: x.impact_pct, reverse=True)

    return BalanceSheetImpact(
        estimated_losses=round(float(estimated_losses), 2),
        post_stress_car=post_stress_car,
        baseline_car=round(baseline_car, 2),
        post_stress_npl=post_stress_npl,
        baseline_npl=round(baseline_npl, 2),
        liquidity_ratio=liquidity_remaining,
        baseline_liquidity=baseline_liquidity,
        capital_shortfall=capital_shortfall,
        risk_level=risk_level,
        tier1_capital_remaining=round(float(remaining_capital), 2),
        sensitivities=sensitivities_list,
    )



def get_sensitivity_matrix(db: Session) -> SensitivityMatrixResponse:
    base = simulate_what_if(db, 0.05, 0.02, 0.15, 0.10)
    baseline_car = base.post_stress_car

    # Compute marginal drops
    unemp_impact = abs(simulate_what_if(db, 0.06, 0.02, 0.15, 0.10).post_stress_car - baseline_car)
    rate_impact = abs(simulate_what_if(db, 0.05, 0.03, 0.15, 0.10).post_stress_car - baseline_car)
    prop_impact = abs(simulate_what_if(db, 0.05, 0.02, 0.16, 0.10).post_stress_car - baseline_car)
    deposit_impact = abs(simulate_what_if(db, 0.05, 0.02, 0.15, 0.11).post_stress_car - baseline_car)

    factors = [
        FactorSensitivity(factor="unemployment_shock", label="Unemployment Rate (+1%)", impact_pct=round(unemp_impact, 2)),
        FactorSensitivity(factor="rate_shock", label="Interest Rate Hike (+1%)", impact_pct=round(rate_impact, 2)),
        FactorSensitivity(factor="property_price_drop", label="Property Price Drop (+1%)", impact_pct=round(prop_impact, 2)),
        FactorSensitivity(factor="deposit_outflow_pct", label="Deposit Outflow (+1%)", impact_pct=round(deposit_impact, 2)),
    ]
    factors.sort(key=lambda x: x.impact_pct, reverse=True)

    return SensitivityMatrixResponse(
        baseline_car=baseline_car,
        sensitivities=factors,
    )
