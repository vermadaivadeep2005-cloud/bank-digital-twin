from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.services.kpi_service import compute_kpis
from app.services.ai_service import (
    generate_executive_copilot_analysis,
    generate_scenario_from_prompt,
    chat_with_financial_copilot,
)

router = APIRouter(prefix="/ai", tags=["AI Copilot"])


class PromptPayload(BaseModel):
    prompt: str


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatPayload(BaseModel):
    messages: List[ChatMessage]
    current_page: Optional[str] = "/"
    page_context: Optional[Dict[str, Any]] = None


@router.get("/copilot")
def get_executive_ai_copilot(db: Session = Depends(get_db)):
    """
    Returns AI Executive Chief Risk Officer memo analyzing bank KPIs and Basel III compliance.
    """
    try:
        kpis = compute_kpis(db)
        analysis = generate_executive_copilot_analysis(kpis)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-scenario")
def ai_generate_scenario(payload: PromptPayload):
    """
    Uses Groq LLaMA 3.3 70B to convert a natural language prompt into quantitative shock parameters.
    """
    if not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt string cannot be empty.")
    try:
        scenario = generate_scenario_from_prompt(payload.prompt)
        return scenario
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat")
def ai_financial_chat(payload: ChatPayload, db: Session = Depends(get_db)):
    """
    Interactive conversation with AI Financial Risk Copilot.
    """
    try:
        kpis = compute_kpis(db)
        msgs = [m.model_dump() for m in payload.messages]
        reply = chat_with_financial_copilot(
            messages=msgs,
            kpis_context=kpis,
            current_page=payload.current_page or "/",
            page_context=payload.page_context,
        )
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
