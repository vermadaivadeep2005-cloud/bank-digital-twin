from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime


class CustomerOut(BaseModel):
    id: UUID
    name: str
    age: int
    income: float
    credit_score: int
    employment_status: str
    region: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CustomerFilter(BaseModel):
    employment_status: Optional[str] = None
    region: Optional[str] = None
    min_credit_score: Optional[int] = None
    max_credit_score: Optional[int] = None
    search: Optional[str] = None
