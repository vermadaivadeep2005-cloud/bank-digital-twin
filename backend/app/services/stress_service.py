from sqlalchemy.orm import Session
import logging
from app.schemas.stress import StressTestRequest, StressTestResponse, ReverseStressRequest, ReverseStressResponse
from app.simulation.monte_carlo import run_monte_carlo_vectorized, run_reverse_stress_test
from app.models.stress_run import StressRun
from app.core.exceptions import PortfolioEmptyError, SimulationError

logger = logging.getLogger("bank_twin")


def run_and_persist_stress_test(
    db: Session,
    req: StressTestRequest,
) -> StressTestResponse:
    """Executes Monte Carlo stress simulation supporting Vasicek Copulas and persists run history in database."""
    logger.info(
        f"Executing stress test '{req.scenario_name}' (Copula: {req.copula_type}) with params: unemp={req.unemployment_shock}, rate={req.rate_shock}, sims={req.n_sims}"
    )

    result = run_monte_carlo_vectorized(
        db=db,
        unemployment_shock=req.unemployment_shock,
        rate_shock=req.rate_shock,
        copula_type=req.copula_type,
        degrees_of_freedom=req.degrees_of_freedom,
        n_sims=req.n_sims,
        horizon_months=req.horizon_months,
        seed=req.seed,
    )

    if "error" in result:
        raise PortfolioEmptyError()

    params_dict = req.model_dump()

    # Persist StressRun entity
    run = StressRun(
        scenario_name=req.scenario_name,
        params=params_dict,
        results={
            "summary": result["summary"],
            "survived_pct": result["survived_pct"],
            "copula_type": req.copula_type,
        },
    )
    db.add(run)
    db.commit()

    return StressTestResponse(
        scenario_name=req.scenario_name,
        params=params_dict,
        summary=result["summary"],
        tail_risk_comparison=result.get("tail_risk_comparison"),
        model_results=result.get("model_results"),
        distribution=result["distribution"],
        capital_paths=result["capital_paths"],
        survived_pct=result["survived_pct"],
        segment_breakdown=result.get("segment_breakdown"),
    )


def run_and_persist_reverse_stress_test(
    db: Session,
    req: ReverseStressRequest,
) -> ReverseStressResponse:
    """Executes Reverse Stress Testing and 2-Way Mitigation Retesting."""
    logger.info(
        f"Executing reverse stress test '{req.scenario_name}' targeting {req.target_metric}={req.target_value}"
    )

    actions_dict = req.actions.model_dump() if req.actions else {}

    res = run_reverse_stress_test(
        db=db,
        target_metric=req.target_metric,
        target_value=req.target_value,
        copula_type=req.copula_type,
        degrees_of_freedom=req.degrees_of_freedom,
        n_sims=req.n_sims,
        horizon_months=req.horizon_months,
        actions=actions_dict,
        scenario_name=req.scenario_name,
    )

    if "error" in res:
        raise PortfolioEmptyError()

    # Persist in StressRun database
    run = StressRun(
        scenario_name=req.scenario_name,
        params=req.model_dump(),
        results={
            "target_metric": req.target_metric,
            "target_value": req.target_value,
            "breaking_shock": res["breaking_shock"],
            "mitigation_status": res["mitigation_status"],
        },
    )
    db.add(run)
    db.commit()

    return ReverseStressResponse(
        scenario_name=req.scenario_name,
        target_metric=req.target_metric,
        target_value=req.target_value,
        copula_type=req.copula_type,
        degrees_of_freedom=req.degrees_of_freedom,
        breaking_shock=res["breaking_shock"],
        pre_mitigation_results=res["pre_mitigation_results"],
        post_mitigation_results=res["post_mitigation_results"],
        comparison=res["comparison"],
        mitigation_status=res["mitigation_status"],
        summary_advisory=res["summary_advisory"],
    )
