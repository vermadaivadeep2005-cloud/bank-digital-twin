from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Dict, List, Any, Optional
from uuid import UUID
from datetime import datetime


class StressTestRequest(BaseModel):
    scenario_name: str = Field("Custom Scenario", max_length=100)
    unemployment_shock: float = Field(0.05, ge=0.0, le=0.30, description="Unemployment shock in percentage points (0.0 to 0.30)")
    rate_shock: float = Field(0.02, ge=-0.05, le=0.10, description="Interest rate shock (e.g., 0.02 = +200 bps)")
    copula_type: str = Field("gaussian", description="Vasicek copula dependency model: gaussian or student_t")
    degrees_of_freedom: int = Field(5, ge=3, le=30, description="Student-t copula degrees of freedom (nu)")
    n_sims: int = Field(1000, ge=100, le=10000, description="Number of Monte Carlo simulations (100 to 10,000)")
    horizon_months: int = Field(24, ge=6, le=60, description="Stress testing horizon in months (6 to 60)")
    seed: Optional[int] = Field(42, description="Deterministic random seed")
    regulatory_profile: str = Field("india_rbi", description="Regulatory threshold profile")

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


class TailRiskComparison(BaseModel):
    gaussian_expected_loss: float
    gaussian_p95_loss: float
    gaussian_survived_pct: float
    student_t_expected_loss: float
    student_t_p95_loss: float
    student_t_survived_pct: float
    tail_risk_gap_loss: float
    tail_risk_gap_pct: float
    summary_insight: str


class StressTestResponse(BaseModel):
    scenario_name: str
    params: Dict[str, Any]
    summary: StressSummary
    tail_risk_comparison: Optional[TailRiskComparison] = None
    model_results: Optional[Dict[str, Any]] = None
    distribution: List[float]
    capital_paths: Dict[str, List[float]]
    survived_pct: float
    segment_breakdown: Optional[Dict[str, List[SegmentImpact]]] = None


class MitigationActions(BaseModel):
    capital_injection: float = Field(0.0, ge=0.0, description="Fresh Tier 1 capital injected in USD")
    portfolio_derisk_pct: float = Field(0.0, ge=0.0, le=0.50, description="Percentage of high-risk assets de-risked to safe bonds")
    npl_provision_boost: float = Field(0.0, ge=0.0, le=0.50, description="Additional provision buffer percentage")
    liquidity_facility_drawdown: float = Field(0.0, ge=0.0, description="Emergency liquidity line drawdown in USD")


class ReverseStressRequest(BaseModel):
    scenario_name: str = Field("Reverse Stress Test & 2-Way Mitigation", max_length=100)
    target_metric: str = Field("car_breach", description="car_breach (<8%), solvency_breach (<=0%), or loss_threshold")
    target_value: float = Field(8.0, description="Target metric breaking threshold value (e.g. 8.0 for CAR)")
    copula_type: str = Field("gaussian", description="gaussian or student_t")
    degrees_of_freedom: int = Field(5, ge=3, le=30)
    n_sims: int = Field(1000, ge=100, le=5000)
    horizon_months: int = Field(24, ge=6, le=60)
    actions: Optional[MitigationActions] = Field(default_factory=MitigationActions)
    regulatory_profile: str = Field("india_rbi", description="Regulatory threshold profile")


class TwoWayComparison(BaseModel):
    metric_name: str
    pre_mitigation: str
    post_mitigation: str
    delta: str
    status: str  # RECOVERED, IMPROVED, UNCHANGED, BREACHED


class ReverseStressResponse(BaseModel):
    scenario_name: str
    target_metric: str
    target_value: float
    copula_type: str
    degrees_of_freedom: int
    breaking_shock: Dict[str, float]  # unemployment_shock, rate_shock
    pre_mitigation_results: Dict[str, Any]
    post_mitigation_results: Dict[str, Any]
    comparison: List[TwoWayComparison]
    mitigation_status: str  # RECOVERED, PARTIALLY_MITIGATED, INSUFFICIENT_ACTION
    summary_advisory: str


class StressRunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    scenario_name: str
    params: Dict[str, Any]
    results: Dict[str, Any]
    created_at: datetime
