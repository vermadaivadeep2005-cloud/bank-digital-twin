from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.compliance import ComplianceReportResponse, ComplianceGapsResponse, StressCheckRequest, ComplianceMetricItem
from app.services.compliance_service import get_full_compliance_report, get_compliance_gaps, compute_compliance_matrix
from app.services.stress_service import run_and_persist_stress_test
from app.schemas.stress import StressTestRequest

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("/report", response_model=ComplianceReportResponse)
def fetch_compliance_report(db: Session = Depends(get_db)):
    return get_full_compliance_report(db)


@router.get("/gaps", response_model=ComplianceGapsResponse)
def fetch_compliance_gaps(db: Session = Depends(get_db)):
    return get_compliance_gaps(db)


@router.post("/stress-check", response_model=List[ComplianceMetricItem])
def evaluate_stress_compliance(
    req: StressCheckRequest = StressCheckRequest(),
    db: Session = Depends(get_db)
):
    stress_res = run_and_persist_stress_test(
        db,
        req=StressTestRequest(
            unemployment_shock=req.unemployment_shock,
            rate_shock=req.rate_shock,
            horizon_months=12,
            n_sims=500
        )
    )

    # Post stress CAR and NPL
    tot_out = float(stress_res.summary.portfolio_size)
    exp_loss = float(stress_res.summary.expected_loss)
    capital = tot_out * 0.105
    rem_capital = capital - exp_loss
    rwa = tot_out * 0.70

    post_car = (rem_capital / rwa * 100.0) if rwa > 0 else 0.0
    post_npl = min(35.0, (exp_loss / tot_out * 100.0) + 2.5) if tot_out > 0 else 5.0

    return compute_compliance_matrix(db, car_override=post_car, npl_override=post_npl)
