from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import date, datetime


class LoanOut(BaseModel):
    id: UUID
    customer_id: Optional[UUID] = None
    principal: float
    outstanding: float
    interest_rate: float
    term_months: int
    loan_type: str
    status: str
    region: str
    origination_date: Optional[date] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LoanFilter(BaseModel):
    loan_type: Optional[str] = None
    status: Optional[str] = None
    region: Optional[str] = None
    min_outstanding: Optional[float] = None
    max_outstanding: Optional[float] = None
