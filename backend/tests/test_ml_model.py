import pytest
from app.simulation.ml_credit_model import predict_loan_risk_ml


def test_ml_risk_prediction_calibrated_shap():
    # Good borrower profile
    res_good = predict_loan_risk_ml(
        credit_score=780,
        income=120000.0,
        age=42,
        employment_status="employed",
        loan_type="mortgage",
        principal=250000.0,
        outstanding=150000.0,
        interest_rate=0.045,
    )
    assert 0.0 <= res_good["probability_of_default"] <= 100.0
    assert 0.0 <= res_good["calibrated_pd"] <= 100.0
    assert "top_risk_drivers" in res_good
    assert "shap_values" in res_good
    assert "model_version" in res_good
    assert "v3.0" in res_good["model_version"] or "v2.1" in res_good["model_version"]
    assert "auc_roc" in res_good
    assert "gini_coefficient" in res_good

    # Risky borrower profile
    res_risky = predict_loan_risk_ml(
        credit_score=520,
        income=25000.0,
        age=25,
        employment_status="unemployed",
        loan_type="personal",
        principal=30000.0,
        outstanding=28000.0,
        interest_rate=0.18,
    )
    assert res_risky["calibrated_pd"] > res_good["calibrated_pd"]
