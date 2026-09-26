from pydantic import BaseModel, Field
from typing import List, Dict, Optional


class WhatIfSimulateRequest(BaseModel):
    unemployment_shock: float = Field(0.05, ge=0.0, le=0.30)
    rate_shock: float = Field(0.02, ge=0.0, le=0.10)
    property_price_drop: float = Field(0.15, ge=0.0, le=0.50)
    deposit_outflow_pct: float = Field(0.10, ge=0.0, le=0.40)


class BalanceSheetImpact(BaseModel):
    estimated_losses: float
    post_stress_car: float
    baseline_car: float
    post_stress_npl: float
    baseline_npl: float
    liquidity_ratio: float
    baseline_liquidity: float
    capital_shortfall: float
    risk_level: str  # Low, Medium, High, Critical
    tier1_capital_remaining: float
    sensitivities: Optional[List["FactorSensitivity"]] = None


class FactorSensitivity(BaseModel):
    factor: str
    label: str
    impact_pct: float  # Marginal drop in CAR % per 1% shock shift


class SensitivityMatrixResponse(BaseModel):
    baseline_car: float
    sensitivities: List[FactorSensitivity]
