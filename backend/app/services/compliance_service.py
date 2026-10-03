from datetime import datetime
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.services.kpi_service import compute_kpis
from app.schemas.compliance import (
    ComplianceMetricItem,
    ComplianceReportResponse,
    ComplianceGapsResponse,
    FrameworkInfo,
)


def evaluate_metric_status(val: float, threshold_val: float, req_buffer: float, is_max: bool = False) -> Tuple[str, str]:
    if is_max:
        if val > threshold_val:
            return "fail", "critical"
        elif val > (threshold_val - req_buffer):
            return "warning", "medium"
        else:
            return "pass", "low"
    else:
        if val < threshold_val:
            return "fail", "critical"
        elif val < (threshold_val + req_buffer):
            return "warning", "medium"
        else:
            return "pass", "low"


def compute_compliance_matrix(db: Session, car_override: float = None, npl_override: float = None) -> List[ComplianceMetricItem]:
    kpis = compute_kpis(db)
    car_val = car_override if car_override is not None else float(kpis.get("car", 15.2))
    npl_val = npl_override if npl_override is not None else float(kpis.get("npl_ratio", 2.5))

    matrix: List[ComplianceMetricItem] = []

    # ==================== 1. BASEL III / IV FRAMEWORK (INTERNATIONAL) ====================
    # 1. Total Capital Adequacy Ratio (CAR)
    st, sev = evaluate_metric_status(car_val, 8.0, 2.5)
    matrix.append(ComplianceMetricItem(
        metric_key="car",
        name="Total Capital Adequacy Ratio (CAR)",
        category="Solvency & Capital",
        framework_id="basel",
        framework_name="Basel III / IV Framework",
        framework_type="international",
        value=round(car_val, 2),
        minimum=8.0,
        buffer=2.5,
        status=st,
        severity=sev,
        unit="%",
        clause_reference="Basel III Accord Part 2 - Capital Adequacy",
        description="Minimum total capital requirement relative to risk-weighted assets (RWA)."
    ))

    # 2. Tier 1 Capital Ratio
    tier1_val = car_val * 0.70
    st, sev = evaluate_metric_status(tier1_val, 6.0, 2.5)
    matrix.append(ComplianceMetricItem(
        metric_key="tier1_ratio",
        name="Tier 1 Capital Ratio",
        category="Solvency & Capital",
        framework_id="basel",
        framework_name="Basel III / IV Framework",
        framework_type="international",
        value=round(tier1_val, 2),
        minimum=6.0,
        buffer=2.5,
        status=st,
        severity=sev,
        unit="%",
        clause_reference="Basel III Pillar 1 - Tier 1 Core Capital",
        description="Core equity capital and disclosed reserves ratio against total RWA."
    ))

    # 3. Common Equity Tier 1 (CET1)
    cet1_val = car_val * 0.58
    st, sev = evaluate_metric_status(cet1_val, 4.5, 2.5)
    matrix.append(ComplianceMetricItem(
        metric_key="cet1_ratio",
        name="Common Equity Tier 1 (CET1) Ratio",
        category="Solvency & Capital",
        framework_id="basel",
        framework_name="Basel III / IV Framework",
        framework_type="international",
        value=round(cet1_val, 2),
        minimum=4.5,
        buffer=2.5,
        status=st,
        severity=sev,
        unit="%",
        clause_reference="Basel III Standard - Common Equity Minimum",
        description="Highest quality loss-absorbing capital ratio."
    ))

    # 4. Liquidity Coverage Ratio (LCR)
    lcr_val = 118.5 if npl_val < 10.0 else max(75.0, 118.5 - npl_val * 2.0)
    st, sev = evaluate_metric_status(lcr_val, 100.0, 10.0)
    matrix.append(ComplianceMetricItem(
        metric_key="lcr",
        name="Liquidity Coverage Ratio (LCR)",
        category="Liquidity Standards",
        framework_id="basel",
        framework_name="Basel III / IV Framework",
        framework_type="international",
        value=round(lcr_val, 1),
        minimum=100.0,
        buffer=10.0,
        status=st,
        severity=sev,
        unit="%",
        clause_reference="Basel III LCR Standard - 30-Day Liquidity Stress",
        description="High-quality liquid assets (HQLA) to cover short-term net cash outflows."
    ))

    # 5. Net Stable Funding Ratio (NSFR)
    nsfr_val = 112.4 if npl_val < 10.0 else max(80.0, 112.4 - npl_val * 1.5)
    st, sev = evaluate_metric_status(nsfr_val, 100.0, 5.0)
    matrix.append(ComplianceMetricItem(
        metric_key="nsfr",
        name="Net Stable Funding Ratio (NSFR)",
        category="Liquidity Standards",
        framework_id="basel",
        framework_name="Basel III / IV Framework",
        framework_type="international",
        value=round(nsfr_val, 1),
        minimum=100.0,
        buffer=5.0,
        status=st,
        severity=sev,
        unit="%",
        clause_reference="Basel III NSFR Rule - Structural Funding Balance",
        description="Available stable funding relative to required stable funding over a 1-year horizon."
    ))

    # 6. Leverage Ratio
    lev_val = car_val * 0.35
    st, sev = evaluate_metric_status(lev_val, 3.0, 1.0)
    matrix.append(ComplianceMetricItem(
        metric_key="leverage_ratio",
        name="Basel III Leverage Ratio",
        category="Exposure & Leverage",
        framework_id="basel",
        framework_name="Basel III / IV Framework",
        framework_type="international",
        value=round(lev_val, 2),
        minimum=3.0,
        buffer=1.0,
        status=st,
        severity=sev,
        unit="%",
        clause_reference="Basel III Leverage Ratio Standard",
        description="Non-risk-weighted leverage metric comparing Tier 1 capital to total exposure."
    ))

    # 7. Capital Conservation Buffer (CCB)
    ccb_val = max(0.0, car_val - 8.0)
    st, sev = evaluate_metric_status(ccb_val, 2.5, 0.5)
    matrix.append(ComplianceMetricItem(
        metric_key="ccb",
        name="Capital Conservation Buffer (CCB)",
        category="Solvency & Capital",
        framework_id="basel",
        framework_name="Basel III / IV Framework",
        framework_type="international",
        value=round(ccb_val, 2),
        minimum=2.5,
        buffer=0.5,
        status=st,
        severity=sev,
        unit="%",
        clause_reference="Basel III CCB Mandate - Capital Buffers",
        description="Mandatory capital buffer designed to absorb losses during periods of financial stress."
    ))

    # ==================== 2. RBI REGULATORY FRAMEWORK (LOCAL REGULATORY) ====================
    # 8. RBI Cash Reserve Ratio (CRR)
    crr_val = 4.65
    st, sev = evaluate_metric_status(crr_val, 4.50, 0.5)
    matrix.append(ComplianceMetricItem(
        metric_key="rbi_crr",
        name="Cash Reserve Ratio (CRR)",
        category="Monetary Policy & Liquidity",
        framework_id="rbi",
        framework_name="RBI Regulatory Framework",
        framework_type="local",
        value=crr_val,
        minimum=4.50,
        buffer=0.5,
        status=st,
        severity=sev,
        unit="%",
        clause_reference="RBI Act 1934 - Section 42(1)",
        description="Mandatory share of net demand and time liabilities (NDTL) held as liquid cash with Reserve Bank of India."
    ))

    # 9. RBI Statutory Liquidity Ratio (SLR)
    slr_val = 18.85
    st, sev = evaluate_metric_status(slr_val, 18.00, 2.0)
    matrix.append(ComplianceMetricItem(
        metric_key="rbi_slr",
        name="Statutory Liquidity Ratio (SLR)",
        category="Monetary Policy & Liquidity",
        framework_id="rbi",
        framework_name="RBI Regulatory Framework",
        framework_type="local",
        value=slr_val,
        minimum=18.00,
        buffer=2.0,
        status=st,
        severity=sev,
        unit="%",
        clause_reference="Banking Regulation Act 1949 - Section 24",
        description="Minimum percentage of NDTL maintained in safe government securities, gold, and approved liquid assets."
    ))

    # 10. RBI Priority Sector Lending (PSL) Target
    psl_val = 41.80
    st, sev = evaluate_metric_status(psl_val, 40.00, 5.0)
    matrix.append(ComplianceMetricItem(
        metric_key="rbi_psl",
        name="Priority Sector Lending (PSL) Compliance",
        category="Social & Sectoral Credit",
        framework_id="rbi",
        framework_name="RBI Regulatory Framework",
        framework_type="local",
        value=psl_val,
        minimum=40.00,
        buffer=5.0,
        status=st,
        severity=sev,
        unit="%",
        clause_reference="RBI Master Direction - Priority Sector Lending Targets",
        description="Mandatory credit allocation threshold to agriculture, MSMEs, education, and weaker economic sectors."
    ))

    # 11. RBI Gross NPA Ratio (Prompt Corrective Action - PCA Threshold)
    gross_npa_val = npl_val
    st, sev = evaluate_metric_status(gross_npa_val, 6.00, 1.5, is_max=True)
    matrix.append(ComplianceMetricItem(
        metric_key="rbi_gross_npa",
        name="Gross NPA Ratio (PCA Trigger Threshold)",
        category="Asset Quality & Solvency",
        framework_id="rbi",
        framework_name="RBI Regulatory Framework",
        framework_type="local",
        value=round(gross_npa_val, 2),
        minimum=6.00,
        buffer=1.5,
        status=st,
        severity=sev,
        unit="%",
        clause_reference="RBI Prompt Corrective Action (PCA) Framework v2024",
        description="Maximum permissible non-performing asset limit before triggering regulatory restrictions.",
        is_max_threshold=True
    ))

    # 12. RBI Net NPA Ratio
    net_npa_val = round(npl_val * 0.45, 2)
    st, sev = evaluate_metric_status(net_npa_val, 3.00, 1.0, is_max=True)
    matrix.append(ComplianceMetricItem(
        metric_key="rbi_net_npa",
        name="Net NPA Ratio Limit",
        category="Asset Quality & Solvency",
        framework_id="rbi",
        framework_name="RBI Regulatory Framework",
        framework_type="local",
        value=net_npa_val,
        minimum=3.00,
        buffer=1.0,
        status=st,
        severity=sev,
        unit="%",
        clause_reference="RBI Prudential Norms on Income Recognition & Provisioning",
        description="Net unprovisioned bad loans percentage against total net advances.",
        is_max_threshold=True
    ))

    # 13. RBI Provision Coverage Ratio (PCR)
    pcr_val = 74.50 if npl_val < 8.0 else max(50.0, 74.50 - (npl_val - 8.0) * 3.0)
    st, sev = evaluate_metric_status(pcr_val, 70.00, 5.0)
    matrix.append(ComplianceMetricItem(
        metric_key="rbi_pcr",
        name="Provision Coverage Ratio (PCR)",
        category="Asset Quality & Solvency",
        framework_id="rbi",
        framework_name="RBI Regulatory Framework",
        framework_type="local",
        value=round(pcr_val, 1),
        minimum=70.00,
        buffer=5.0,
        status=st,
        severity=sev,
        unit="%",
        clause_reference="RBI Master Circular - NPA Provisioning Directives",
        description="Percentage of bad loans covered by provisions set aside by the bank."
    ))

    # ==================== 3. FATF STANDARDS (INTERNATIONAL AML/CFT) ====================
    # 14. Customer Due Diligence (CDD / KYC) Compliance
    kyc_val = 98.90
    st, sev = evaluate_metric_status(kyc_val, 98.00, 1.5)
    matrix.append(ComplianceMetricItem(
        metric_key="fatf_cdd_kyc",
        name="Customer Due Diligence (CDD/KYC) Verification",
        category="AML / CFT Compliance",
        framework_id="fatf",
        framework_name="FATF Standards",
        framework_type="international",
        value=kyc_val,
        minimum=98.00,
        buffer=1.5,
        status=st,
        severity=sev,
        unit="%",
        clause_reference="FATF Recommendation 10 - Customer Due Diligence",
        description="Percentage of active accounts with verified identity documentation and risk classification."
    ))

    # 15. Suspicious Transaction Report (STR) Filing Velocity
    str_val = 99.40
    st, sev = evaluate_metric_status(str_val, 99.00, 0.8)
    matrix.append(ComplianceMetricItem(
        metric_key="fatf_str_filing",
        name="Suspicious Transaction Report (STR) Filing Rate",
        category="AML / CFT Compliance",
        framework_id="fatf",
        framework_name="FATF Standards",
        framework_type="international",
        value=str_val,
        minimum=99.00,
        buffer=0.8,
        status=st,
        severity=sev,
        unit="%",
        clause_reference="FATF Recommendation 20 - Suspicious Transaction Reporting",
        description="Timely filing of suspicious transaction reports to Financial Intelligence Units (FIU)."
    ))

    # 16. Politically Exposed Persons (PEP) Screening Resolution
    pep_val = 99.80
    st, sev = evaluate_metric_status(pep_val, 99.50, 0.4)
    matrix.append(ComplianceMetricItem(
        metric_key="fatf_pep_screening",
        name="PEP & Sanctions Screening Resolution Rate",
        category="AML / CFT Compliance",
        framework_id="fatf",
        framework_name="FATF Standards",
        framework_type="international",
        value=pep_val,
        minimum=99.50,
        buffer=0.4,
        status=st,
        severity=sev,
        unit="%",
        clause_reference="FATF Recommendation 12 - Politically Exposed Persons",
        description="Enhanced due diligence resolution speed for PEP customer hits and family associate matches."
    ))

    # 17. Ultimate Beneficial Ownership (UBO) Transparency Index
    ubo_val = 92.30
    st, sev = evaluate_metric_status(ubo_val, 90.00, 5.0)
    matrix.append(ComplianceMetricItem(
        metric_key="fatf_ubo",
        name="Ultimate Beneficial Ownership (UBO) Transparency",
        category="AML / CFT Compliance",
        framework_id="fatf",
        framework_name="FATF Standards",
        framework_type="international",
        value=ubo_val,
        minimum=90.00,
        buffer=5.0,
        status=st,
        severity=sev,
        unit="%",
        clause_reference="FATF Recommendation 24 & 25 - Corporate Transparency & UBO",
        description="Identification and verification index of natural persons exercising ultimate control over corporate entities."
    ))

    # 18. FATF High-Risk Jurisdiction Exposure Limit
    hr_val = 1.10
    st, sev = evaluate_metric_status(hr_val, 2.00, 0.5, is_max=True)
    matrix.append(ComplianceMetricItem(
        metric_key="fatf_high_risk_jurisdiction",
        name="High-Risk Jurisdiction Exposure Threshold",
        category="AML / CFT Compliance",
        framework_id="fatf",
        framework_name="FATF Standards",
        framework_type="international",
        value=hr_val,
        minimum=2.00,
        buffer=0.5,
        status=st,
        severity=sev,
        unit="%",
        clause_reference="FATF Recommendation 19 - Countermeasures for High-Risk Countries",
        description="Maximum portfolio transaction exposure limit to FATF grey-listed or high-risk jurisdictions.",
        is_max_threshold=True
    ))

    return matrix


def get_full_compliance_report(db: Session) -> ComplianceReportResponse:
    matrix = compute_compliance_matrix(db)
    passed = sum(1 for m in matrix if m.status == "pass")
    warning = sum(1 for m in matrix if m.status == "warning")
    failing = sum(1 for m in matrix if m.status == "fail")

    overall = "BREACH" if failing > 0 else ("WARNING" if warning > 0 else "PASS")

    # Group metrics by framework_id to produce FrameworkInfo summaries
    framework_defs = [
        ("rbi", "RBI Regulatory Framework", "local", "Reserve Bank of India Monetary Policy & Prudential Norms"),
        ("basel", "Basel III / IV Accord", "international", "Global Capital Adequacy, Solvency, & Liquidity Standards"),
        ("fatf", "FATF Standards", "international", "Financial Action Task Force International AML/CFT Standards"),
    ]

    frameworks_info: List[FrameworkInfo] = []
    for fw_id, fw_name, fw_type, fw_desc in framework_defs:
        fw_metrics = [m for m in matrix if m.framework_id == fw_id]
        fw_passed = sum(1 for m in fw_metrics if m.status == "pass")
        fw_warning = sum(1 for m in fw_metrics if m.status == "warning")
        fw_failing = sum(1 for m in fw_metrics if m.status == "fail")
        fw_status = "BREACH" if fw_failing > 0 else ("WARNING" if fw_warning > 0 else "PASS")

        frameworks_info.append(FrameworkInfo(
            id=fw_id,
            name=fw_name,
            type=fw_type,
            description=fw_desc,
            total_metrics=len(fw_metrics),
            passed_count=fw_passed,
            warning_count=fw_warning,
            failing_count=fw_failing,
            status=fw_status
        ))

    return ComplianceReportResponse(
        overall_status=overall,
        total_metrics=len(matrix),
        passed_count=passed,
        warning_count=warning,
        failing_count=failing,
        frameworks=frameworks_info,
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

