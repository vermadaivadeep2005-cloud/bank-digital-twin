from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict
from uuid import UUID
from datetime import datetime


class TransactionOut(BaseModel):
    id: UUID
    customer_id: Optional[UUID] = None
    account_id: Optional[UUID] = None
    amount: float
    type: str
    category: str
    timestamp: datetime
    merchant: Optional[str] = None
    location: Optional[str] = None
    is_flagged: bool = False

    model_config = ConfigDict(from_attributes=True)


class TransactionGenerateRequest(BaseModel):
    count: int = 100


class TransactionSummary(BaseModel):
    total_count: int
    total_volume: float
    flagged_count: int
    volume_by_type: Dict[str, float]
    volume_by_category: Dict[str, float]
