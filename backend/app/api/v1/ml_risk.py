from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any, List
from app.simulation.ml_credit_model import predict_loan_risk_ml

router = APIRouter(prefix="/ml", tags=["Machine Learning Risk Engine"])


class PredictRiskRequest(BaseModel):
    credit_score: int = Field(700, ge=300, le=850)
    income: float = Field(75000.0, ge=10000.0)
    age: int = Field(38, ge=18, le=100)
    employment_status: str = Field("employed")  # employed / self-employed / unemployed / retired
    loan_type: str = Field("mortgage")          # mortgage / personal / auto / business
    principal: float = Field(250000.0, ge=1000.0)
    outstanding: float = Field(180000.0, ge=0.0)
    interest_rate: float = Field(0.065, ge=0.001, le=0.30)


@router.post("/predict")
def predict_risk(req: PredictRiskRequest):
    return predict_loan_risk_ml(
        credit_score=req.credit_score,
        income=req.income,
        age=req.age,
        employment_status=req.employment_status,
        loan_type=req.loan_type,
        principal=req.principal,
        outstanding=req.outstanding,
        interest_rate=req.interest_rate,
    )
