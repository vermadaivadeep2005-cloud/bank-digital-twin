from pydantic import BaseModel
from typing import List, Dict, Optional


class FrameworkInfo(BaseModel):
    id: str           # basel, rbi, fatf
    name: str         # Basel III / IV, RBI Framework, FATF Standards
    type: str         # local, international
    description: str
    total_metrics: int
    passed_count: int
    warning_count: int
    failing_count: int
    status: str       # PASS, WARNING, BREACH


class ComplianceMetricItem(BaseModel):
    metric_key: str
    name: str
    category: str        # Capital Adequacy, Monetary Policy, AML/CFT
    framework_id: str    # basel, rbi, fatf
    framework_name: str  # Basel III / IV, RBI Regulatory Framework, FATF Standards
    framework_type: str  # local, international
    value: float
    minimum: float
    buffer: float
    status: str          # pass, warning, fail
    severity: str        # low, medium, high, critical
    unit: str            # %, $M, score
    clause_reference: Optional[str] = None
    description: Optional[str] = None
    is_max_threshold: Optional[bool] = False


class ComplianceReportResponse(BaseModel):
    overall_status: str  # PASS, WARNING, BREACH
    total_metrics: int
    passed_count: int
    warning_count: int
    failing_count: int
    frameworks: List[FrameworkInfo]
    matrix: List[ComplianceMetricItem]
    generated_at: str


class ComplianceGapsResponse(BaseModel):
    gaps_count: int
    gaps: List[ComplianceMetricItem]


class StressCheckRequest(BaseModel):
    unemployment_shock: float = 0.15
    rate_shock: float = 0.04

