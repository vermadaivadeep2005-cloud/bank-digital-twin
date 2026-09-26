from typing import List, Dict, Any

PREDEFINED_SCENARIOS: List[Dict[str, Any]] = [
    {
        "id": "baseline",
        "title": "Baseline Economic Conditions",
        "description": "Standard steady-state macroeconomic environment with normal unemployment and baseline interest rates.",
        "unemployment_shock": 0.0,
        "rate_shock": 0.0,
        "horizon_months": 24,
        "n_sims": 1000,
        "risk_level": "Low",
    },
    {
        "id": "mild_recession",
        "title": "Mild Macroeconomic Recession",
        "description": "Modest economic downturn with a +3.0 percentage point increase in national unemployment and flat interest rates.",
        "unemployment_shock": 0.03,
        "rate_shock": 0.0,
        "horizon_months": 24,
        "n_sims": 1000,
        "risk_level": "Moderate",
    },
    {
        "id": "severe_recession",
        "title": "Severe Economic Depression",
        "description": "Adverse economic collapse with +8.0 pp unemployment spike and severe credit contraction across consumer and corporate sectors.",
        "unemployment_shock": 0.08,
        "rate_shock": 0.015,
        "horizon_months": 24,
        "n_sims": 1000,
        "risk_level": "High",
    },
    {
        "id": "2008_crisis",
        "title": "2008 Subprime Global Financial Crisis",
        "description": "Historical stress scenario mimicking the 2008 GFC: real estate price collapse, +10.0 pp unemployment surge, and high mortgage defaults.",
        "unemployment_shock": 0.10,
        "rate_shock": -0.02,
        "horizon_months": 36,
        "n_sims": 2000,
        "risk_level": "Severe",
    },
    {
        "id": "rate_spike",
        "title": "Hyperinflation & Aggressive Rate Hike",
        "description": "Central bank aggressively hikes policy rates (+400 bps) to curb inflation, placing acute debt service stress on floating-rate borrowers.",
        "unemployment_shock": 0.04,
        "rate_shock": 0.04,
        "horizon_months": 24,
        "n_sims": 1000,
        "risk_level": "High",
    },
    {
        "id": "covid_shock",
        "title": "Pandemic Lockdown Shock",
        "description": "Abrupt economic shutdown causing immediate +12.0 pp unemployment jump with heavy default stress on small business and personal loans.",
        "unemployment_shock": 0.12,
        "rate_shock": -0.01,
        "horizon_months": 24,
        "n_sims": 1500,
        "risk_level": "Extreme",
    },
]


def get_predefined_scenarios() -> List[Dict[str, Any]]:
    return PREDEFINED_SCENARIOS


def add_custom_scenario(scenario_data: Dict[str, Any]) -> Dict[str, Any]:
    scenario_id = scenario_data.get("id", f"custom_{len(PREDEFINED_SCENARIOS) + 1}")
    new_sc = {
        "id": scenario_id,
        "title": scenario_data.get("title", "Custom What-If Scenario"),
        "description": scenario_data.get("description", "Custom scenario generated from What-If interactive simulator."),
        "unemployment_shock": float(scenario_data.get("unemployment_shock", 0.05)),
        "rate_shock": float(scenario_data.get("rate_shock", 0.02)),
        "horizon_months": int(scenario_data.get("horizon_months", 24)),
        "n_sims": int(scenario_data.get("n_sims", 1000)),
        "risk_level": scenario_data.get("risk_level", "Custom"),
    }
    # Avoid duplicate IDs
    PREDEFINED_SCENARIOS.insert(0, new_sc)
    return new_sc


def get_scenario_by_id(scenario_id: str) -> Dict[str, Any]:
    for sc in PREDEFINED_SCENARIOS:
        if sc["id"] == scenario_id:
            return sc
    return PREDEFINED_SCENARIOS[0]

