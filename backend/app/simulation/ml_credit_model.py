import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
import logging

logger = logging.getLogger("bank_twin")

try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False

_ML_MODEL_STATE: Optional[Dict[str, Any]] = None


def _build_training_data(n_samples: int = 2500) -> Tuple[pd.DataFrame, np.ndarray]:
    """Generates synthetic dataset for credit default risk training."""
    rng = np.random.default_rng(42)

    credit_scores = rng.normal(680, 80, n_samples).clip(300, 850)
    incomes = rng.lognormal(10.8, 0.5, n_samples).clip(15000, 500000)
    ages = rng.normal(40, 15, n_samples).clip(18, 85)
    
    emp_statuses = rng.choice(["employed", "self-employed", "unemployed", "retired"], n_samples, p=[0.65, 0.15, 0.08, 0.12])
    emp_numeric = pd.Series(emp_statuses).map({"employed": 0, "self-employed": 1, "unemployed": 2, "retired": 3}).to_numpy()

    loan_types = rng.choice(["mortgage", "personal", "auto", "business"], n_samples, p=[0.4, 0.3, 0.2, 0.1])
    type_numeric = pd.Series(loan_types).map({"mortgage": 0, "personal": 1, "auto": 2, "business": 3}).to_numpy()

    principals = rng.lognormal(11.0, 1.0, n_samples).clip(1000, 1000000)
    outstandings = principals * rng.uniform(0.3, 0.95, n_samples)
    interest_rates = rng.normal(0.07, 0.02, n_samples).clip(0.01, 0.25)

    monthly_income = incomes / 12.0
    r_mo = np.maximum(0.0001, interest_rates / 12.0)
    # Mortgages (360 months), others (60 months)
    terms = np.where(type_numeric == 0, 360, 60)
    approx_monthly_pmt = outstandings * (r_mo * (1 + r_mo)**terms) / np.maximum(1e-5, ((1 + r_mo)**terms - 1))
    dti = np.clip(approx_monthly_pmt / np.maximum(100.0, monthly_income), 0.05, 0.95)

    #Solvency: Higher income and lower DTI reduce default probability
    income_risk_factor = np.clip(1.0 - (incomes / 120000.0), -0.25, 0.35)

    default_prob = (
        (850 - credit_scores) / 550 * 0.35 +
        income_risk_factor * 0.25 +
        (emp_numeric == 2).astype(float) * 0.30 +
        (dti > 0.35).astype(float) * 0.30 +
        (interest_rates > 0.10).astype(float) * 0.15
    )
    default_prob = np.clip(default_prob, 0.01, 0.90)
    y = (rng.uniform(0, 1, n_samples) < default_prob).astype(int)

    X = pd.DataFrame({
        "credit_score": credit_scores,
        "income": incomes,
        "age": ages,
        "employment_numeric": emp_numeric,
        "loan_type_numeric": type_numeric,
        "principal": principals,
        "outstanding": outstandings,
        "interest_rate": interest_rates,
        "dti": dti,
    })

    return X, y


def train_and_cache_model(force_retrain: bool = False) -> Dict[str, Any]:
    global _ML_MODEL_STATE
    if _ML_MODEL_STATE is not None and not force_retrain:
        return _ML_MODEL_STATE

    logger.info("Training upgraded ML Credit Model with Calibration & SHAP support...")
    X, y = _build_training_data(2500)
    feature_names = list(X.columns)

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)

    rf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    rf.fit(X_train_scaled, y_train)

    calibrated_clf = CalibratedClassifierCV(estimator=rf, method="isotonic", cv=3)
    calibrated_clf.fit(X_train_scaled, y_train)

    val_preds_prob = calibrated_clf.predict_proba(X_val_scaled)[:, 1]
    auc_score = float(roc_auc_score(y_val, val_preds_prob))
    gini_score = float(2.0 * auc_score - 1.0)

    # SHAP explainer
    explainer = None
    if HAS_SHAP:
        try:
            explainer = shap.TreeExplainer(rf)
        except Exception as e:
            logger.warning(f"Could not initialize SHAP TreeExplainer: {e}")

    _ML_MODEL_STATE = {
        "scaler": scaler,
        "rf": rf,
        "calibrated_clf": calibrated_clf,
        "explainer": explainer,
        "feature_names": feature_names,
        "model_version": "v2.1-calibrated-shap",
        "auc_roc": round(auc_score, 4),
        "gini_coefficient": round(gini_score, 4),
        "trained_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "sample_count": len(X),
    }

    return _ML_MODEL_STATE


def predict_loan_risk_ml(
    credit_score: int,
    income: float,
    age: int,
    employment_status: str,
    loan_type: str,
    principal: float,
    outstanding: float,
    interest_rate: float,
) -> Dict[str, Any]:
    state = train_and_cache_model()

    scaler: StandardScaler = state["scaler"]
    rf: RandomForestClassifier = state["rf"]
    calibrated_clf: CalibratedClassifierCV = state["calibrated_clf"]
    explainer = state["explainer"]
    feature_names: List[str] = state["feature_names"]

    emp_map = {"employed": 0, "self-employed": 1, "unemployed": 2, "retired": 3}
    type_map = {"mortgage": 0, "personal": 1, "auto": 2, "business": 3}

    emp_num = emp_map.get(employment_status.lower(), 0)
    type_num = type_map.get(loan_type.lower(), 0)

    # Normalize shorthand inputs (e.g., user typing 25 -> $25,000, 34 -> $34,000)
    norm_principal = float(principal)
    if 0 < norm_principal < 1000:
        norm_principal *= 1000.0

    norm_outstanding = float(outstanding)
    if 0 < norm_outstanding < 1000:
        norm_outstanding *= 1000.0

    monthly_income = max(100.0, income / 12.0)
    r_mo = max(0.0001, interest_rate / 12.0)
    term_months = 360 if type_num == 0 else 60
    approx_pmt = norm_outstanding * (r_mo * (1 + r_mo)**term_months) / max(1e-5, ((1 + r_mo)**term_months - 1))
    dti = min(0.95, max(0.05, approx_pmt / monthly_income))

    # Bound features for StandardScaler to prevent out-of-distribution leaf node anomalies
    bounded_principal = max(1000.0, min(1000000.0, norm_principal))
    bounded_outstanding = max(500.0, min(1000000.0, norm_outstanding))

    input_df = pd.DataFrame([{
        "credit_score": float(credit_score),
        "income": float(income),
        "age": float(age),
        "employment_numeric": float(emp_num),
        "loan_type_numeric": float(type_num),
        "principal": float(bounded_principal),
        "outstanding": float(bounded_outstanding),
        "interest_rate": float(interest_rate),
        "dti": float(dti),
    }])

    scaled_input = scaler.transform(input_df)

    raw_pd = float(rf.predict_proba(scaled_input)[0][1])
    calibrated_pd = float(calibrated_clf.predict_proba(scaled_input)[0][1])

    # Categorize Risk Grade & Level
    if calibrated_pd < 0.05:
        risk_grade, risk_level, variant = "A", "Low Risk", "success"
    elif calibrated_pd < 0.15:
        risk_grade, risk_level, variant = "B", "Moderate Risk", "info"
    elif calibrated_pd < 0.30:
        risk_grade, risk_level, variant = "C", "High Risk", "warning"
    else:
        risk_grade, risk_level, variant = "D", "Critical Risk", "danger"

    # SHAP Value calculation
    shap_values_dict = {}
    shap_contributions = []

    if explainer is not None:
        try:
            raw_shap = explainer.shap_values(scaled_input)
            if isinstance(raw_shap, list):
                # Binary classification -> class 1
                shap_vec = raw_shap[1][0]
            elif isinstance(raw_shap, np.ndarray) and raw_shap.ndim == 3:
                shap_vec = raw_shap[0, :, 1]
            else:
                shap_vec = raw_shap[0]

            for fname, val in zip(feature_names, shap_vec):
                clean_name = fname.replace("_numeric", "").replace("_", " ").title()
                sv = round(float(val), 4)
                shap_values_dict[fname] = sv
                shap_contributions.append({"feature": clean_name, "shap_value": sv})
        except Exception as e:
            logger.warning(f"Error computing SHAP values: {e}")

    # Fallback / Top Drivers from Tree Importances
    importances = dict(zip(feature_names, rf.feature_importances_))
    sorted_importances = sorted(importances.items(), key=lambda x: x[1], reverse=True)

    top_drivers = [
        {"feature": name.replace("_numeric", "").replace("_", " ").title(), "importance": round(val * 100, 1)}
        for name, val in sorted_importances[:4]
    ]

    return {
        "raw_probability_of_default": round(raw_pd * 100.0, 2),
        "probability_of_default": round(calibrated_pd * 100.0, 2),
        "calibrated_pd": round(calibrated_pd * 100.0, 2),
        "risk_grade": risk_grade,
        "risk_level": risk_level,
        "variant": variant,
        "debt_to_income_ratio": round(dti * 100.0, 1),
        "top_risk_drivers": top_drivers,
        "shap_values": shap_values_dict,
        "shap_contributions": shap_contributions,
        "model_version": state["model_version"],
        "auc_roc": state["auc_roc"],
        "gini_coefficient": state["gini_coefficient"],
        "model_type": "Calibrated Random Forest Classifier (Scikit-Learn)",
    }
