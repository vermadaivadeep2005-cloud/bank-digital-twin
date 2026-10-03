from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any, List
from app.simulation.ml_credit_model import predict_loan_risk_ml

router = APIRouter(prefix="/ml", tags=["Machine Learning Risk Engine"])


class PredictRiskRequest(BaseModel):
    credit_score: int = Field(720, ge=300, le=850)
    income: float = Field(85000.0, ge=0.0) # Primary annual income
    asset_income: float = Field(15000.0, ge=0.0) # Collective asset/rental/shop annual income
    age: int = Field(40, ge=18, le=100)
    employment_status: str = Field("employed") # legacy compatibility
    employment_type: str = Field("pvt_permanent") # gov_permanent / pvt_permanent / contractual / self_employed / unemployed
    profession_sector: str = Field("it_tech") # gov_public / healthcare / it_tech / finance / trade_retail / construction_manufacturing / other
    loan_type: str = Field("mortgage") # mortgage / home / business / personal / auto / education
    principal: float = Field(250000.0, ge=1000.0)
    outstanding: float = Field(180000.0, ge=0.0)
    interest_rate: float = Field(0.055, ge=0.001, le=0.30)
    tenure_months: int = Field(180, ge=6, le=360)
    monthly_expenses: float = Field(1500.0, ge=0.0)
    existing_emis: float = Field(500.0, ge=0.0)


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
        asset_income=req.asset_income,
        employment_type=req.employment_type,
        profession_sector=req.profession_sector,
        tenure_months=req.tenure_months,
        monthly_expenses=req.monthly_expenses,
        existing_emis=req.existing_emis,
    )
