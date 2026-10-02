import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_fx_rates_live():
    response = client.get("/api/v1/fx/rates?base=USD")
    assert response.status_code == 200
    data = response.json()
    assert "rates" in data
    assert "INR" in data["rates"]
    assert "EUR" in data["rates"]
    assert "GBP" in data["rates"]


def test_get_fx_rates_historical():
    response = client.get("/api/v1/fx/rates?base=USD&date=2024-10-02")
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == "2024-10-02"
    assert "rates" in data
    assert data["rates"]["INR"] > 0


def test_convert_fx_with_dynamic_fee():
    payload = {
        "amount": 10000,
        "from_currency": "USD",
        "to_currency": "EUR",
        "date": "2024-10-02",
        "fee_percent": 0.25,
    }
    response = client.post("/api/v1/fx/convert", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    conversion = data["conversion"]
    assert conversion["from_currency"] == "USD"
    assert conversion["to_currency"] == "EUR"
    assert conversion["gross_converted_amount"] > 0
    assert conversion["conversion_fee_amount"] > 0
    assert conversion["net_converted_amount"] < conversion["gross_converted_amount"]
