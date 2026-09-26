import numpy as np
import pandas as pd
from typing import Dict, Tuple

# Basel / industry standard Loss Given Default (LGD) by asset class
LGD_BY_LOAN_TYPE: Dict[str, float] = {
    "mortgage": 0.25,   # secured by real estate
    "auto": 0.45,       # secured by vehicle
    "business": 0.55,   # commercial assets / cash flows
    "personal": 0.65,   # unsecured consumer loan
}

# Basel asset correlation parameters (Vasicek model)
RHO_BY_LOAN_TYPE: Dict[str, float] = {
    "mortgage": 0.15,
    "business": 0.18,
    "auto": 0.12,
    "personal": 0.08,
}


def compute_baseline_pd(df: pd.DataFrame) -> np.ndarray:
    """
    Computes baseline monthly probability of default (PD) for each loan in the portfolio.
    
    Formula:
    Base PD = Logistic( (620 - credit_score) / 40 ) * employment_multiplier * loan_type_multiplier * monthly_scaling
    """
    credit_scores = df["credit_score"].to_numpy(dtype=np.float64)
    
    # Logistic credit score response (620 score -> ~1% annual base risk)
    score_factor = 1.0 / (1.0 + np.exp((credit_scores - 620.0) / 40.0))
    
    # Employment multiplier
    emp_map = {"employed": 1.0, "self-employed": 1.3, "unemployed": 3.0, "retired": 1.1}
    emp_mult = df["employment"].map(emp_map).fillna(1.0).to_numpy(dtype=np.float64)
    
    # Loan type risk multiplier
    type_map = {"mortgage": 0.4, "personal": 1.6, "auto": 1.0, "business": 1.4}
    type_mult = df["loan_type"].map(type_map).fillna(1.0).to_numpy(dtype=np.float64)
    
    # Scale to baseline monthly PD
    monthly_pd = score_factor * emp_mult * type_mult * 0.002
    return np.clip(monthly_pd, 0.0001, 0.30)


def get_lgd_array(df: pd.DataFrame) -> np.ndarray:
    """Returns LGD vector corresponding to loan dataframe."""
    return df["loan_type"].map(LGD_BY_LOAN_TYPE).fillna(0.50).to_numpy(dtype=np.float64)


def get_asset_correlation_array(df: pd.DataFrame) -> np.ndarray:
    """Returns Vasicek asset correlation coefficient (rho) for each loan."""
    return df["loan_type"].map(RHO_BY_LOAN_TYPE).fillna(0.12).to_numpy(dtype=np.float64)


def apply_vasicek_systemic_shock(
    base_pd: np.ndarray,
    rho: np.ndarray,
    macro_z: float,
    idiosyncratic_eps: np.ndarray
) -> np.ndarray:
    """
    Applies Vasicek single-factor model:
    Y_i = sqrt(rho_i) * Z + sqrt(1 - rho_i) * epsilon_i
    Conditional PD = NormCDF( ( NormQuantile(base_pd) - sqrt(rho_i) * Z ) / sqrt(1 - rho_i) )
    """
    from scipy.stats import norm
    
    # Convert base PD to latent threshold
    norm_inv_pd = norm.ppf(np.clip(base_pd, 1e-6, 0.9999))
    
    # Shift threshold under systemic macro factor Z (where Z < 0 represents adverse macro shock)
    sqrt_rho = np.sqrt(rho)
    sqrt_one_minus_rho = np.sqrt(1.0 - rho)
    
    # Conditional probability under macro shock Z and idiosyncratic epsilon
    latent_threshold = (norm_inv_pd - sqrt_rho * macro_z) / sqrt_one_minus_rho
    cond_pd = norm.cdf(latent_threshold)
    
    return np.clip(cond_pd, 1e-6, 0.99)
