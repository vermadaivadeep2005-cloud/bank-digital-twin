from pydantic import BaseModel
from typing import Optional


class ScenarioOut(BaseModel):
    id: str
    title: str
    description: str
    unemployment_shock: float
    rate_shock: float
    horizon_months: int
    n_sims: int
    risk_level: str  # Low, Moderate, High, Severe, Extreme
