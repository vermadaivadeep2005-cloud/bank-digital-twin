from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from app.services.fx_service import fetch_fx_rates, calculate_fx_conversion

router = APIRouter(prefix="/fx", tags=["forex"])


class FxConvertRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount in source currency to convert")
    from_currency: str = Field("USD", description="Source currency code (USD, INR, EUR, GBP)")
    to_currency: str = Field("EUR", description="Target currency code (USD, INR, EUR, GBP)")
    date: Optional[str] = Field(None, description="Historical date in YYYY-MM-DD format or 'latest'")
    fee_percent: Optional[float] = Field(0.25, ge=0, le=5.0, description="Dynamic FX conversion fee percentage")


@router.get("/rates")
async def get_fx_rates(
    base: str = Query("USD", description="Base currency code"),
    date: Optional[str] = Query(None, description="Historical date YYYY-MM-DD or 'latest'"),
):
    """
    Get live or historical forex exchange rates powered by European Central Bank (Frankfurter API).
    """
    rates_data = await fetch_fx_rates(base=base, date_str=date)
    return rates_data


@router.post("/convert")
async def convert_fx(payload: FxConvertRequest):
    """
    Dynamically convert currency with live or historical ECB exchange rates and dynamic transaction fee calculation.
    """
    rates_data = await fetch_fx_rates(base=payload.from_currency, date_str=payload.date)
    rates = rates_data.get("rates", {})
    to_curr = payload.to_currency.upper()

    if to_curr not in rates:
        raise HTTPException(
            status_code=400,
            detail=f"Target currency '{to_curr}' not supported. Choose from USD, INR, EUR, GBP.",
        )

    raw_rate = rates[to_curr]
    conversion = calculate_fx_conversion(
        amount=payload.amount,
        from_curr=payload.from_currency,
        to_curr=payload.to_currency,
        raw_rate=raw_rate,
        fee_percent=payload.fee_percent if payload.fee_percent is not None else 0.25,
    )

    return {
        "status": "success",
        "provider": rates_data.get("provider"),
        "date_used": rates_data.get("date"),
        "is_historical": (payload.date is not None and payload.date != "latest"),
        "conversion": conversion,
    }
