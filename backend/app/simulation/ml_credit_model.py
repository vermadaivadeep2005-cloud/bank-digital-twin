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


def _build_training_data(n_samples: int = 3000) -> Tuple[pd.DataFrame, np.ndarray]:
    """Generates synthetic dataset for realistic bank credit default risk training."""
    rng = np.random.default_rng(42)

    credit_scores = rng.normal(690, 75, n_samples).clip(300, 850)
    primary_incomes = rng.lognormal(10.8, 0.5, n_samples).clip(15000, 500000)
    # Asset income (rental, shop, dividends) - 35% of applicants have asset income
    has_asset_income = rng.choice([0.0, 1.0], n_samples, p=[0.65, 0.35])
    asset_incomes = has_asset_income * rng.lognormal(9.5, 0.8, n_samples).clip(0, 150000)
    total_incomes = primary_incomes + asset_incomes
    monthly_incomes = total_incomes / 12.0

    ages = rng.normal(41, 13, n_samples).clip(18, 85)

    # Employment Type: 0=Gov Permanent, 1=Pvt Permanent, 2=Contractual/Gig, 3=Self-Employed/Business, 4=Unemployed
    emp_types = rng.choice(["gov_permanent", "pvt_permanent", "contractual", "self_employed", "unemployed"], n_samples, p=[0.20, 0.50, 0.15, 0.10, 0.05])
    emp_numeric = pd.Series(emp_types).map({
        "gov_permanent": 0,
        "pvt_permanent": 1,
        "contractual": 2,
        "self_employed": 3,
        "unemployed": 4,
    }).to_numpy()

    # Loan Type: 0=Home/Mortgage, 1=Personal, 2=Auto, 3=Business, 4=Education
    loan_types = rng.choice(["mortgage", "personal", "auto", "business", "education"], n_samples, p=[0.35, 0.30, 0.18, 0.12, 0.05])
    type_numeric = pd.Series(loan_types).map({
        "mortgage": 0,
        "personal": 1,
        "auto": 2,
        "business": 3,
        "education": 4,
    }).to_numpy()

    principals = rng.lognormal(11.2, 1.0, n_samples).clip(2000, 1000000)
    outstandings = principals * rng.uniform(0.35, 0.95, n_samples)
    interest_rates = rng.normal(0.075, 0.025, n_samples).clip(0.02, 0.28)

    terms = np.where(type_numeric == 0, 360, np.where(type_numeric == 2, 60, 48))

    r_mo = np.maximum(0.0001, interest_rates / 12.0)
    new_emi = outstandings * (r_mo * (1 + r_mo)**terms) / np.maximum(1e-5, ((1 + r_mo)**terms - 1))

    # Living Expenses & Existing EMIs
    living_expenses = (monthly_incomes * rng.uniform(0.20, 0.40, n_samples)).clip(500, 10000)
    existing_emis = (monthly_incomes * rng.uniform(0.0, 0.25, n_samples)).clip(0, 5000)

    total_monthly_obligation = new_emi + existing_emis + living_expenses
    foir = np.clip(total_monthly_obligation / np.maximum(500.0, monthly_incomes), 0.10, 1.20)
    dti = np.clip((new_emi + existing_emis) / np.maximum(500.0, monthly_incomes), 0.05, 0.95)

    # Risk Weight Factors according to bank underwriting standard rules
    emp_risk_multiplier = pd.Series(emp_numeric).map({0: 0.60, 1: 0.85, 2: 1.40, 3: 1.25, 4: 2.80}).to_numpy()
    loan_risk_multiplier = pd.Series(type_numeric).map({0: 0.70, 1: 1.50, 2: 0.90, 3: 1.30, 4: 1.10}).to_numpy()

    default_prob = (
        (850 - credit_scores) / 550 * 0.30 +
        (foir > 0.50).astype(float) * 0.35 +
        (foir > 0.65).astype(float) * 0.25 +
        emp_risk_multiplier * 0.15 +
        loan_risk_multiplier * 0.15 +
        (asset_incomes > 0).astype(float) * (-0.12)
    )
    default_prob = np.clip(default_prob, 0.01, 0.92)
    y = (rng.uniform(0, 1, n_samples) < default_prob).astype(int)

    X = pd.DataFrame({
        "credit_score": credit_scores,
        "primary_income": primary_incomes,
        "asset_income": asset_incomes,
        "total_income": total_incomes,
        "age": ages,
        "employment_type_numeric": emp_numeric,
        "loan_type_numeric": type_numeric,
        "principal": principals,
        "outstanding": outstandings,
        "interest_rate": interest_rates,
        "living_expenses": living_expenses,
        "existing_emis": existing_emis,
        "foir": foir,
        "dti": dti,
    })

    return X, y


def train_and_cache_model(force_retrain: bool = False) -> Dict[str, Any]:
    global _ML_MODEL_STATE
    if _ML_MODEL_STATE is not None and not force_retrain:
        return _ML_MODEL_STATE

    logger.info("Training Bank Underwriting Credit Model with FOIR & Asset Income...")
    X, y = _build_training_data(3000)
    feature_names = list(X.columns)

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)

    rf = RandomForestClassifier(n_estimators=120, max_depth=9, random_state=42)
    rf.fit(X_train_scaled, y_train)

    calibrated_clf = CalibratedClassifierCV(estimator=rf, method="isotonic", cv=3)
    calibrated_clf.fit(X_train_scaled, y_train)

    val_preds_prob = calibrated_clf.predict_proba(X_val_scaled)[:, 1]
    auc_score = float(roc_auc_score(y_val, val_preds_prob))
    gini_score = float(2.0 * auc_score - 1.0)

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
        "model_version": "v3.0-bank-underwriter",
        "auc_roc": round(auc_score, 4),
        "gini_coefficient": round(gini_score, 4),
        "trained_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "sample_count": len(X),
    }

    return _ML_MODEL_STATE


def predict_loan_risk_ml(
    credit_score: int = 720,
    income: float = 85000.0,
    age: int = 40,
    employment_status: str = "employed",
    loan_type: str = "mortgage",
    principal: float = 250000.0,
    outstanding: float = 180000.0,
    interest_rate: float = 0.055,
    asset_income: float = 0.0,
    employment_type: str = "pvt_permanent",
    profession_sector: str = "it_tech",
    tenure_months: int = 180,
    monthly_expenses: float = 1500.0,
    existing_emis: float = 500.0,
) -> Dict[str, Any]:
    state = train_and_cache_model()
    if state.get("model_version") != "v3.0-bank-underwriter":
        state = train_and_cache_model(force_retrain=True)

    scaler: StandardScaler = state["scaler"]
    rf: RandomForestClassifier = state["rf"]
    calibrated_clf: CalibratedClassifierCV = state["calibrated_clf"]
    explainer = state["explainer"]
    feature_names: List[str] = state["feature_names"]

    emp_type_map = {
        "gov_permanent": 0,
        "pvt_permanent": 1,
        "contractual": 2,
        "self_employed": 3,
        "unemployed": 4,
        "employed": 1,
        "retired": 1,
    }
    loan_type_map = {
        "mortgage": 0,
        "home": 0,
        "personal": 1,
        "auto": 2,
        "business": 3,
        "education": 4,
    }

    clean_emp = employment_type.lower() if employment_type else employment_status.lower()
    clean_loan = loan_type.lower()

    emp_num = emp_type_map.get(clean_emp, 1)
    type_num = loan_type_map.get(clean_loan, 0)

    # Normalize inputs
    norm_principal = max(1000.0, float(principal))
    norm_outstanding = max(0.0, float(outstanding))
    norm_primary_income = max(1000.0, float(income))
    norm_asset_income = max(0.0, float(asset_income))
    norm_total_income = norm_primary_income + norm_asset_income

    primary_monthly_inc = norm_primary_income / 12.0
    asset_monthly_inc = norm_asset_income / 12.0
    total_monthly_inc = norm_total_income / 12.0

    norm_monthly_exp = max(0.0, float(monthly_expenses))
    norm_existing_emis = max(0.0, float(existing_emis))

    # Calculate EMI & FOIR
    r_mo = max(0.0001, interest_rate / 12.0)
    actual_tenure = max(6, int(tenure_months))
    
    # Financial EMI Formula: P * r * (1+r)^n / ((1+r)^n - 1)
    emi = norm_principal * (r_mo * (1 + r_mo)**actual_tenure) / max(1e-5, ((1 + r_mo)**actual_tenure - 1))

    total_obligation = emi + norm_existing_emis + norm_monthly_exp
    foir = total_obligation / max(100.0, total_monthly_inc)
    dti = (emi + norm_existing_emis) / max(100.0, total_monthly_inc)

    net_disposable = total_monthly_inc - total_obligation

    # Max Eligible Loan Calculation under 50% FOIR Rule
    max_allowed_emi = max(0.0, (total_monthly_inc * 0.50) - norm_existing_emis - norm_monthly_exp)
    max_eligible_loan = max_allowed_emi * ((1 + r_mo)**actual_tenure - 1) / (r_mo * (1 + r_mo)**actual_tenure)

    bounded_principal = max(1000.0, min(1000000.0, norm_principal))
    bounded_outstanding = max(0.0, min(1000000.0, norm_outstanding))

    input_df = pd.DataFrame([{
        "credit_score": float(credit_score),
        "primary_income": float(norm_primary_income),
        "asset_income": float(norm_asset_income),
        "total_income": float(norm_total_income),
        "age": float(age),
        "employment_type_numeric": float(emp_num),
        "loan_type_numeric": float(type_num),
        "principal": float(bounded_principal),
        "outstanding": float(bounded_outstanding),
        "interest_rate": float(interest_rate),
        "living_expenses": float(norm_monthly_exp),
        "existing_emis": float(norm_existing_emis),
        "foir": float(min(1.5, foir)),
        "dti": float(min(1.0, dti)),
    }])

    scaled_input = scaler.transform(input_df)

    raw_pd = float(rf.predict_proba(scaled_input)[0][1])
    calibrated_pd = float(calibrated_clf.predict_proba(scaled_input)[0][1])

    # Categorize Risk Grade & Level
    if calibrated_pd < 0.04:
        risk_grade, risk_level, variant = "AAA", "Prime Low Risk", "success"
    elif calibrated_pd < 0.10:
        risk_grade, risk_level, variant = "AA", "Low Risk", "success"
    elif calibrated_pd < 0.18:
        risk_grade, risk_level, variant = "A", "Moderate Low Risk", "info"
    elif calibrated_pd < 0.28:
        risk_grade, risk_level, variant = "B", "Moderate Risk", "warning"
    elif calibrated_pd < 0.42:
        risk_grade, risk_level, variant = "C", "High Risk", "warning"
    else:
        risk_grade, risk_level, variant = "D", "Critical Default Risk", "danger"

    # Bank Underwriting Decision Logic
    if foir > 0.65 or credit_score < 560 or net_disposable < 0:
        underwriting_decision = "DECLINED"
        decision_reason = f"FOIR of {foir * 100:.1f}% exceeds bank limit (65%). Net disposable income is insufficient."
    elif foir > 0.50 or credit_score < 650:
        underwriting_decision = "CONDITIONALLY APPROVED"
        decision_reason = f"FOIR is {foir * 100:.1f}%. Requires co-applicant income or tenure extension to reduce monthly EMI."
    else:
        underwriting_decision = "APPROVED"
        decision_reason = "Solid income cash flow coverage, acceptable FOIR obligation, and healthy credit standing."

    # SHAP & Feature Drivers
    shap_values_dict = {}
    shap_contributions = []

    if explainer is not None:
        try:
            raw_shap = explainer.shap_values(scaled_input)
            if isinstance(raw_shap, list):
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
        "underwriting_decision": underwriting_decision,
        "decision_reason": decision_reason,
        "new_loan_emi": round(emi, 2),
        "total_monthly_income": round(total_monthly_inc, 2),
        "primary_monthly_income": round(primary_monthly_inc, 2),
        "asset_monthly_income": round(asset_monthly_inc, 2),
        "monthly_expenses": round(norm_monthly_exp, 2),
        "existing_emis": round(norm_existing_emis, 2),
        "total_monthly_obligation": round(total_obligation, 2),
        "net_disposable_income": round(net_disposable, 2),
        "foir_ratio": round(foir * 100.0, 1),
        "debt_to_income_ratio": round(dti * 100.0, 1),
        "max_eligible_loan_principal": round(max_eligible_loan, 2),
        "max_eligible_emi": round(max_allowed_emi, 2),
        "top_risk_drivers": top_drivers,
        "shap_values": shap_values_dict,
        "shap_contributions": shap_contributions,
        "model_version": state["model_version"],
        "auc_roc": state["auc_roc"],
        "gini_coefficient": state["gini_coefficient"],
        "model_type": "Calibrated Random Forest Classifier (Scikit-Learn)",
    }
