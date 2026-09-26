from fastapi import APIRouter, Body
from typing import List, Dict, Any
from app.schemas.scenario import ScenarioOut
from app.simulation.scenarios import get_predefined_scenarios, add_custom_scenario

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])


@router.get("", response_model=List[ScenarioOut])
def list_scenarios():
    return get_predefined_scenarios()


@router.post("", response_model=ScenarioOut)
def create_scenario(payload: Dict[str, Any] = Body(...)):
    return add_custom_scenario(payload)
