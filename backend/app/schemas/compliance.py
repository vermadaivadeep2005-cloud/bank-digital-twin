from pydantic import BaseModel
from typing import List, Dict, Optional


class ComplianceMetricItem(BaseModel):
    metric_key: str
    name: str
    category: str  # Basel III, CCAR, DFAST, Liquidity
    value: float
    minimum: float
    buffer: float
    status: str    # pass, warning, fail
    severity: str  # low, medium, high, critical
    unit: str      # %, $M


class ComplianceReportResponse(BaseModel):
    overall_status: str  # PASS, WARNING, BREACH
    total_metrics: int
    passed_count: int
    warning_count: int
    failing_count: int
    matrix: List[ComplianceMetricItem]
    generated_at: str


class ComplianceGapsResponse(BaseModel):
    gaps_count: int
    gaps: List[ComplianceMetricItem]


class StressCheckRequest(BaseModel):
    unemployment_shock: float = 0.15
    rate_shock: float = 0.04
