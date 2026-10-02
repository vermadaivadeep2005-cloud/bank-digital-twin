import httpx
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger("bank_twin")

# Standard fallback rates relative to 1.0 USD if external network is unavailable
DEFAULT_FX_RATES = {
    "USD": 1.0,
    "INR": 84.50,
    "EUR": 0.92,
    "GBP": 0.78,
}

FRANKFURTER_BASE_URL = "https://api.frankfurter.app"
OPEN_ER_BASE_URL = "https://open.er-api.com/v6/latest"


async def fetch_fx_rates(base: str = "USD", date_str: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetch live or historical exchange rates using Frankfurter API (ECB Data).
    Falls back to open.er-api.com or static rates if external API fails.
    """
    base = base.upper().strip()
    endpoint_date = date_str if (date_str and date_str != "latest") else "latest"

    url = f"{FRANKFURTER_BASE_URL}/{endpoint_date}?from={base}&to=INR,EUR,GBP,USD"

    try:
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                rates = data.get("rates", {})
                rates[base] = 1.0
                return {
                    "provider": "European Central Bank (Frankfurter API)",
                    "base": base,
                    "date": data.get("date", endpoint_date),
                    "rates": rates,
                    "is_live": (endpoint_date == "latest"),
                }
    except Exception as e:
        logger.warning(f"Frankfurter FX API request failed ({e}). Attempting fallback...")

    # Fallback to Open ER API for latest rates
    if endpoint_date == "latest":
        try:
            async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
                resp = await client.get(f"{OPEN_ER_BASE_URL}/{base}")
                if resp.status_code == 200:
                    data = resp.json()
                    all_rates = data.get("rates", {})
                    filtered_rates = {
                        "USD": all_rates.get("USD", 1.0),
                        "INR": all_rates.get("INR", 84.50),
                        "EUR": all_rates.get("EUR", 0.92),
                        "GBP": all_rates.get("GBP", 0.78),
                    }
                    return {
                        "provider": "ExchangeRate-API (Fallback Provider)",
                        "base": base,
                        "date": datetime.utcnow().strftime("%Y-%m-%d"),
                        "rates": filtered_rates,
                        "is_live": True,
                    }
        except Exception as ex:
            logger.warning(f"Fallback FX API failed ({ex}). Returning default baseline rates.")

    # Ultimate fallback static rates
    return {
        "provider": "Institutional Baseline (Offline Reserve)",
        "base": base,
        "date": date_str or datetime.utcnow().strftime("%Y-%m-%d"),
        "rates": DEFAULT_FX_RATES,
        "is_live": False,
    }


def calculate_fx_conversion(
    amount: float,
    from_curr: str,
    to_curr: str,
    raw_rate: float,
    fee_percent: float = 0.25,
) -> Dict[str, Any]:
    """
    Computes dynamic FX conversion including institutional spread and transfer fee breakdowns.
    """
    gross_converted = amount * raw_rate
    conversion_fee = gross_converted * (fee_percent / 100.0)
    net_converted = gross_converted - conversion_fee
    effective_rate = raw_rate * (1.0 - (fee_percent / 100.0))

    return {
        "from_currency": from_curr.upper(),
        "to_currency": to_curr.upper(),
        "original_amount": amount,
        "mid_market_rate": raw_rate,
        "conversion_fee_percent": fee_percent,
        "gross_converted_amount": round(gross_converted, 2),
        "conversion_fee_amount": round(conversion_fee, 2),
        "net_converted_amount": round(net_converted, 2),
        "effective_exchange_rate": round(effective_rate, 6),
    }
