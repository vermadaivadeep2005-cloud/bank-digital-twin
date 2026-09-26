from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.what_if import WhatIfSimulateRequest, BalanceSheetImpact, SensitivityMatrixResponse
from app.services.what_if_service import simulate_what_if, get_sensitivity_matrix

router = APIRouter(prefix="/what-if", tags=["what-if"])


@router.post("/simulate", response_model=BalanceSheetImpact)
def run_what_if_simulation(
    req: WhatIfSimulateRequest = WhatIfSimulateRequest(),
    db: Session = Depends(get_db)
):
    return simulate_what_if(
        db,
        unemployment_shock=req.unemployment_shock,
        rate_shock=req.rate_shock,
        property_price_drop=req.property_price_drop,
        deposit_outflow_pct=req.deposit_outflow_pct,
    )


@router.get("/sensitivity", response_model=SensitivityMatrixResponse)
def fetch_sensitivity_matrix(db: Session = Depends(get_db)):
    return get_sensitivity_matrix(db)
