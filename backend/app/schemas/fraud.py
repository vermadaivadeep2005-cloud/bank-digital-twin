from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class FraudScanRequest(BaseModel):
    transaction_id: Optional[UUID] = None
    customer_id: Optional[UUID] = None
    limit: int = 50


class FraudScanResult(BaseModel):
    transaction_id: UUID
    customer_id: Optional[UUID] = None
    amount: float
    type: str
    category: str
    timestamp: datetime
    rule_triggers: List[str]
    ml_anomaly_score: float
    fraud_score: float
    risk_tier: str
    is_flagged: bool


class FraudAlertResponse(BaseModel):
    alerts: List[FraudScanResult]
    total_alerts: int
    critical_count: int
    high_count: int


class FraudTrainResponse(BaseModel):
    message: str
    trained_samples: int
    contamination: float
