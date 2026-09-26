from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.services.kpi_service import compute_kpis
from app.schemas.compliance import ComplianceMetricItem, ComplianceReportResponse, ComplianceGapsResponse


def evaluate_metric_status(val: float, min_val: float, req_buffer: float) -> tuple[str, str]:
    if val < min_val:
        return "fail", "critical"
    elif val < (min_val + req_buffer):
        return "warning", "medium"
    else:
        return "pass", "low"


def compute_compliance_matrix(db: Session, car_override: float = None, npl_override: float = None) -> List[ComplianceMetricItem]:
    kpis = compute_kpis(db)
    car_val = car_override if car_override is not None else float(kpis.get("car", 15.2))
    npl_val = npl_override if npl_override is not None else float(kpis.get("npl_ratio", 2.5))

    matrix = []

    # 1. Total Capital Adequacy Ratio (CAR)
    st, sev = evaluate_metric_status(car_val, 8.0, 2.5)
    matrix.append(ComplianceMetricItem(
        metric_key="car",
        name="Total Capital Adequacy Ratio (CAR)",
        category="Basel III Minimums",
        value=round(car_val, 2),
        minimum=8.0,
        buffer=2.5,
        status=st,
        severity=sev,
        unit="%"
    ))

    # 2. Tier 1 Capital Ratio
    tier1_val = car_val * 0.70
    st, sev = evaluate_metric_status(tier1_val, 6.0, 2.5)
    matrix.append(ComplianceMetricItem(
        metric_key="tier1_ratio",
        name="Tier 1 Capital Ratio",
        category="Basel III Minimums",
        value=round(tier1_val, 2),
        minimum=6.0,
        buffer=2.5,
        status=st,
        severity=sev,
        unit="%"
    ))

    # 3. Common Equity Tier 1 (CET1)
    cet1_val = car_val * 0.58
    st, sev = evaluate_metric_status(cet1_val, 4.5, 2.5)
    matrix.append(ComplianceMetricItem(
        metric_key="cet1_ratio",
        name="Common Equity Tier 1 (CET1) Ratio",
        category="Basel III Minimums",
        value=round(cet1_val, 2),
        minimum=4.5,
        buffer=2.5,
        status=st,
        severity=sev,
        unit="%"
    ))

    # 4. Liquidity Coverage Ratio (LCR)
    lcr_val = 118.5 if npl_val < 10.0 else max(75.0, 118.5 - npl_val * 2.0)
    st, sev = evaluate_metric_status(lcr_val, 100.0, 10.0)
    matrix.append(ComplianceMetricItem(
        metric_key="lcr",
        name="Liquidity Coverage Ratio (LCR)",
        category="Basel III Liquidity",
        value=round(lcr_val, 1),
        minimum=100.0,
        buffer=10.0,
        status=st,
        severity=sev,
        unit="%"
    ))

    # 5. Leverage Ratio
    lev_val = car_val * 0.35
    st, sev = evaluate_metric_status(lev_val, 3.0, 1.0)
    matrix.append(ComplianceMetricItem(
        metric_key="leverage_ratio",
        name="Basel III Leverage Ratio",
        category="Basel III Minimums",
        value=round(lev_val, 2),
        minimum=3.0,
        buffer=1.0,
        status=st,
        severity=sev,
        unit="%"
    ))

    # 6. Capital Conservation Buffer (CCB)
    ccb_val = max(0.0, car_val - 8.0)
    st, sev = evaluate_metric_status(ccb_val, 2.5, 0.5)
    matrix.append(ComplianceMetricItem(
        metric_key="ccb",
        name="Capital Conservation Buffer (CCB)",
        category="Basel III Buffers",
        value=round(ccb_val, 2),
        minimum=2.5,
        buffer=0.5,
        status=st,
        severity=sev,
        unit="%"
    ))

    # 7. Non-Performing Loan Threshold (CCAR Benchmark)
    st_npl, sev_npl = ("pass", "low") if npl_val < 5.0 else (("warning", "medium") if npl_val < 10.0 else ("fail", "critical"))
    matrix.append(ComplianceMetricItem(
        metric_key="npl_ratio",
        name="CCAR NPL Asset Quality Threshold",
        category="CCAR Benchmark",
        value=round(npl_val, 2),
        minimum=5.0,
        buffer=2.0,
        status=st_npl,
        severity=sev_npl,
        unit="%"
    ))

    return matrix


def get_full_compliance_report(db: Session) -> ComplianceReportResponse:
    matrix = compute_compliance_matrix(db)
    passed = sum(1 for m in matrix if m.status == "pass")
    warning = sum(1 for m in matrix if m.status == "warning")
    failing = sum(1 for m in matrix if m.status == "fail")

    overall = "BREACH" if failing > 0 else ("WARNING" if warning > 0 else "PASS")

    return ComplianceReportResponse(
        overall_status=overall,
        total_metrics=len(matrix),
        passed_count=passed,
        warning_count=warning,
        failing_count=failing,
        matrix=matrix,
        generated_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    )


def get_compliance_gaps(db: Session) -> ComplianceGapsResponse:
    matrix = compute_compliance_matrix(db)
    gaps = [m for m in matrix if m.status in ["warning", "fail"]]
    gaps.sort(key=lambda x: (0 if x.status == "fail" else 1))

    return ComplianceGapsResponse(
        gaps_count=len(gaps),
        gaps=gaps
    )
