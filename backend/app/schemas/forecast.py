from pydantic import BaseModel
from typing import List


class ForecastPoint(BaseModel):
    date: str
    value: float
    lower_80: float
    upper_80: float
    lower_95: float
    upper_95: float


class ForecastResponse(BaseModel):
    metric: str
    horizon_days: int
    historical_points: int
    forecast: List[ForecastPoint]
    cached: bool = False
