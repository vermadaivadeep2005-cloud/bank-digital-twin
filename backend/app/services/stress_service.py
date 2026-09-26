from sqlalchemy.orm import Session
import logging
from app.schemas.stress import StressTestRequest, StressTestResponse
from app.simulation.monte_carlo import run_monte_carlo_vectorized
from app.models.stress_run import StressRun
from app.core.exceptions import PortfolioEmptyError, SimulationError

logger = logging.getLogger("bank_twin")


def run_and_persist_stress_test(
    db: Session,
    req: StressTestRequest,
) -> StressTestResponse:
    """Executes Monte Carlo stress simulation and persists run history in database."""
    logger.info(
        f"Executing stress test '{req.scenario_name}' with params: unemp={req.unemployment_shock}, rate={req.rate_shock}, sims={req.n_sims}"
    )

    result = run_monte_carlo_vectorized(
        db=db,
        unemployment_shock=req.unemployment_shock,
        rate_shock=req.rate_shock,
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
        },
    )
    db.add(run)
    db.commit()

    return StressTestResponse(
        scenario_name=req.scenario_name,
        params=params_dict,
        summary=result["summary"],
        distribution=result["distribution"],
        capital_paths=result["capital_paths"],
        survived_pct=result["survived_pct"],
        segment_breakdown=result.get("segment_breakdown"),
    )
