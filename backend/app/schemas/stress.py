from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Dict, List, Any, Optional
from uuid import UUID
from datetime import datetime


class StressTestRequest(BaseModel):
    scenario_name: str = Field("Custom Scenario", max_length=100)
    unemployment_shock: float = Field(0.05, ge=0.0, le=0.30, description="Unemployment shock in percentage points (0.0 to 0.30)")
    rate_shock: float = Field(0.02, ge=-0.05, le=0.10, description="Interest rate shock (e.g., 0.02 = +200 bps)")
    n_sims: int = Field(1000, ge=100, le=10000, description="Number of Monte Carlo simulations (100 to 10,000)")
    horizon_months: int = Field(24, ge=6, le=60, description="Stress testing horizon in months (6 to 60)")
    seed: Optional[int] = Field(42, description="Deterministic random seed")

    @field_validator("scenario_name")
    @classmethod
    def sanitize_scenario_name(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            return "Custom Scenario"
        # Sanitize HTML tags
        cleaned = cleaned.replace("<", "").replace(">", "")
        return cleaned[:100]


class StressSummary(BaseModel):
    expected_loss: float
    p5_loss: float
    p50_loss: float
    p95_loss: float
    worst_case_loss: float
    best_case_loss: float
    initial_capital: float
    portfolio_size: float
    n_loans: int


class SegmentImpact(BaseModel):
    category: str
    expected_loss: float
    loss_pct: float


class StressTestResponse(BaseModel):
    scenario_name: str
    params: Dict[str, Any]
    summary: StressSummary
    distribution: List[float]
    capital_paths: Dict[str, List[float]]
    survived_pct: float
    segment_breakdown: Optional[Dict[str, List[SegmentImpact]]] = None


class StressRunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    scenario_name: str
    params: Dict[str, Any]
    results: Dict[str, Any]
    created_at: datetime
