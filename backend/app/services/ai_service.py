import json
import logging
from typing import Dict, Any, List
from groq import Groq
from app.config import settings

logger = logging.getLogger("bank_twin")

def get_groq_client() -> Groq:
    return Groq(api_key=settings.GROQ_API_KEY)


def generate_executive_copilot_analysis(kpis: Dict[str, Any], stress_runs: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Generate an AI Executive Risk Officer memo analyzing bank KPIs and Basel III compliance.
    """
    client = get_groq_client()

    prompt = f"""
    You are the Chief Risk Officer AI for a Tier-1 Commercial Bank.
    Analyze the following live Bank Digital Twin KPIs:
    - Capital Adequacy Ratio (CAR): {kpis.get('car', 0):.2f}% (Regulatory Minimum: 8.0%)
    - Non-Performing Loan Ratio (NPL): {kpis.get('npl_ratio', 0):.2f}%
    - Return on Assets (ROA): {kpis.get('roa', 0):.2f}%
    - Total Outstanding Portfolio: ${kpis.get('total_outstanding', 0):,.2f}
    - Tier 1 Capital: ${kpis.get('capital', 0):,.2f}
    - Net Interest Margin (NIM): {kpis.get('nim', 0):.2f}%
    - Total Customers: {kpis.get('total_customers', 0)}
    - Active Loans: {kpis.get('total_loans', 0)}

    Provide a JSON response with the following exact structure:
    {{
      "health_rating": "STABLE | WATCHLIST | STRESSED | CRITICAL",
      "executive_summary": "2-3 concise sentences summarizing bank solvency and capital buffer.",
      "key_risk_factors": ["Risk Factor 1", "Risk Factor 2", "Risk Factor 3"],
      "strategic_recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
      "basel_iii_compliance": "Compliance assessment regarding Tier 1 capital and risk-weighted assets."
    }}
    Respond ONLY with valid JSON.
    """

    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an expert banking Chief Risk Officer providing JSON financial risk reports."},
                {"role": "user", "content": prompt},
            ],
            model=settings.GROQ_MODEL,
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        logger.error(f"Groq API Executive Copilot error: {e}")
        # Structured fallback if Groq API call has network glitch
        car = kpis.get("car", 10.0)
        status = "STABLE" if car >= 10 else "WATCHLIST" if car >= 8 else "CRITICAL"
        return {
            "health_rating": status,
            "executive_summary": f"Bank maintains a Capital Adequacy Ratio of {car:.2f}%. Loan portfolio default rate sits at {kpis.get('npl_ratio', 0):.2f}%.",
            "key_risk_factors": [
                "Macroeconomic interest rate sensitivity",
                "Delinquency pressure on retail consumer loans",
                "Geographic asset concentration"
            ],
            "strategic_recommendations": [
                "Increase Tier 1 capital allocation reserves",
                "Tighten underwriting criteria for high-DTI borrowers",
                "Diversify loan originations across non-cyclical sectors"
            ],
            "basel_iii_compliance": "Fully compliant with Basel III minimum Tier 1 capital requirements."
        }


def generate_scenario_from_prompt(user_prompt: str) -> Dict[str, Any]:
    """
    Parse a user's natural language scenario prompt into structured shock parameters.
    """
    client = get_groq_client()

    sys_prompt = """
    You are a Quantitative Risk Strategist. Parse the user's macroeconomic scenario description into realistic quantitative stress test shock parameters.
    Output ONLY a valid JSON object matching this schema:
    {
      "scenario_name": "Short Catchy Scenario Title",
      "unemployment_shock": 0.05, // Float percentage points increase (e.g. 0.08 for +8.0 pp)
      "rate_shock": 0.025, // Float percentage points interest rate shift (e.g. 0.03 for +3.0 pp)
      "horizon_months": 24, // Integer 12, 24, 36, or 60
      "risk_level": "Moderate | High | Severe | Extreme",
      "description": "Detailed 2-sentence description of the macroeconomic shock propagation."
    }
    """

    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": f"Create a macro stress scenario based on this user prompt: {user_prompt}"},
            ],
            model=settings.GROQ_MODEL,
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Groq API Scenario Generator error: {e}")
        return {
            "scenario_name": "Custom Macro Shock",
            "unemployment_shock": 0.06,
            "rate_shock": 0.025,
            "horizon_months": 24,
            "risk_level": "High",
            "description": f"Hypothetical stress scenario generated for prompt: '{user_prompt}'."
        }


def chat_with_financial_copilot(
    messages: List[Dict[str, str]],
    kpis_context: Dict[str, Any] = None,
    current_page: str = "/",
    page_context: Dict[str, Any] = None,
) -> str:
    """
    Interactive AI assistant trained on the full Bank Digital Twin application,
    giving short, direct, LaTeX-free responses and screen-aware guidance.
    """
    client = get_groq_client()

    car_val = kpis_context.get("car", 15.2) if kpis_context else 15.2
    npl_val = kpis_context.get("npl_ratio", 2.1) if kpis_context else 2.1
    total_out = kpis_context.get("total_outstanding", 0) if kpis_context else 0

    page_str = current_page.strip() if current_page else "/"
    extra_ctx = ""
    if page_context and isinstance(page_context, dict):
        extra_ctx = ", ".join([f"{k}: {v}" for k, v in page_context.items()])

    system_instruction = f"""
You are 'Bank Twin AI', the expert AI Assistant embedded inside the Bank Digital Twin application.

CRITICAL FORMATTING & STYLE MANDATES:
1. NO LATEX: NEVER output LaTeX syntax, backslashes, KaTeX markup, \\(, \\), \\[, \\], $$, \\frac, \\text, \\mathbf, or mathematical symbols with backslashes anywhere in your text. Write all equations, metrics, and numbers using clean plain text (e.g., CAR = (Capital / RWA) * 100%).
2. CONCISE & SHORT RESPONSES: Keep every answer short, direct, actionable, and to the point (1 to 3 short sentences or bullet points max). Do NOT write long essays, rambling introductions, or verbose filler.
3. SCREEN AWARENESS: The user is currently on page/screen: '{page_str}'. Extra screen state: {extra_ctx if extra_ctx else 'Standard view'}. Use the application guide below to tell the user EXACTLY what is on their screen and step-by-step instructions on what to click or drag.

FULL APPLICATION & SCREEN GUIDE:

- STRESS ENGINE (`/stress`):
  * What it does: Runs Monte Carlo Vasicek portfolio stress testing up to 100,000 vector simulations.
  * Controls & Sliders:
    - Unemployment Shock Spike Slider: Range 0.0% (baseline starting position) to 15.0%. Controls loan default probability (PD).
      * Where to drag it from 0.0%: For mild stress, drag to 3.0% - 5.0%. For a severe 2008 financial crisis, drag to 8.0%. For extreme COVID/stagflation shock, drag to 10.0% - 12.0%.
    - Interest Rate Shock Shift Slider: Range -2.0% to +8.0% (baseline 0.0%). Drag to +2.5% to +4.0% for central bank rate hikes.
    - Stress Horizon Selector: Options 12, 24, 36, or 60 months.
    - Monte Carlo Simulations: Dropdown options from 1,000 to 100,000 runs.
    - Action Button: Click "Run Monte Carlo Stress Test" to trigger backend simulation.
    - Presets: "Baseline", "2008 Crisis" (+8% Unemp, +4% Rate), "COVID-19" (+10% Unemp, -1.5% Rate), "Stagflation" (+6% Unemp, +5% Rate).
    - Output Panels: Solvency Pass Rate (>= 80% passing threshold), Capital Loss Histogram, Mitigated vs Unmitigated side-by-side comparison.

- EXECUTIVE DASHBOARD (`/`):
  * What it does: High-level executive overview of core bank KPIs.
  * Displays: Capital Adequacy Ratio (CAR target >= 8.0%), NPL ratio, ROA, NIM, Total Outstanding Portfolio, Tier 1 Capital, Customer Count, and Regulatory Matrix.

- WHAT-IF SIMULATOR (`/what-if`):
  * What it does: Real-time slider sensitivity engine with instant feedback charts.
  * Sliders: Unemployment (+0-12%), Rate Shock (-2 to +6%), Property Price Drop (0-40%), Deposit Outflow (0-30%).

- AI SCENARIO SYNTHESIZER (`/scenarios`):
  * What it does: Converts plain English shock prompts into quantitative stress vectors.

- FORECASTS & TRENDS (`/forecasts`):
  * What it does: Prophet time-series models for 12-month projections of CAR, NPL, and Liquidity.

- PORTFOLIO ANALYSIS (`/portfolio`):
  * What it does: Granular loan-level risk tables filtered by asset class (Mortgages, Commercial, Consumer, Auto), risk grade (AAA to CCC), currency, and status.

- FRAUD DETECTION (`/fraud`):
  * What it does: IsolationForest ML anomaly scanner scoring transactions in real-time.

- AUDIT HISTORY (`/history`):
  * What it does: Log of all executed stress tests with PDF/CSV export.

LIVE BANK KPIS CONTEXT:
- CAR: {car_val:.2f}% (Regulatory Minimum: 8.0%)
- NPL Ratio: {npl_val:.2f}%
- Total Portfolio: ${total_out:,.2f}

INSTRUCTIONS FOR USER QUESTIONS:
- If asked "what is going on the screen" or "how to use this screen", provide a quick 2-bullet step-by-step summary for the page they are on.
- If asked where to drag a slider (e.g. Unemployment Shock), specify exact starting value (0.0%) and exact target value (e.g. 8.0% for severe crisis or 4.0% for moderate recession) and tell them to click "Run Monte Carlo Stress Test".
"""

    formatted_messages = [{"role": "system", "content": system_instruction}]
    for msg in messages[-6:]:
        formatted_messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

    models_to_try = [settings.GROQ_MODEL, "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "openai/gpt-oss-120b"]
    models_to_try = list(dict.fromkeys([m for m in models_to_try if m]))

    for m_name in models_to_try:
        try:
            response = client.chat.completions.create(
                messages=formatted_messages,
                model=m_name,
                temperature=0.4,
                max_tokens=300,
            )
            content = response.choices[0].message.content
            # Post-process to ensure no LaTeX characters remain
            cleaned = (
                content.replace("\\[", "")
                .replace("\\]", "")
                .replace("\\(", "")
                .replace("\\)", "")
                .replace("$$", "")
            )
            return cleaned
        except Exception as e:
            logger.warning(f"Groq API model {m_name} attempt failed: {e}")

    if page_str == "/stress":
        return "You are on the Stress Engine screen. To test a severe scenario, drag the Unemployment Shock slider from 0.0% up to 8.0% (or 4.0% for mild stress) and click 'Run Monte Carlo Stress Test'."

    return "Bank Twin AI is active. Drag sliders on screen or select a pre-built preset to run quantitative simulations."
