from pydantic import BaseModel
from typing import List, Optional


class KpiResponse(BaseModel):
    total_customers: int
    total_loans: int
    total_outstanding: float
    npl_ratio: float
    capital: float
    rwa: float
    car: float
    roa: float
    nim: float


class KpiTimePoint(BaseModel):
    date: str
    npl_ratio: float
    car: float
    roa: float
    total_outstanding: float


class KpiTrendResponse(BaseModel):
    current: KpiResponse
    history: List[KpiTimePoint]
