"""Agent control endpoints — status, start, stop."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import AgentConfig

router = APIRouter()


class AgentAction(BaseModel):
    agent_id: str


@router.get("/agents/status")
def get_agent_status(db: Session = Depends(get_db)):
    """Returns the status of all 3 AI agents."""

    agents = db.query(AgentConfig).order_by(AgentConfig.agent_id).all()

    return [
        {
            "agent_id": a.agent_id,
            "name": a.name,
            "description": a.description,
            "status": a.status,
            "last_run": a.last_run.isoformat() + "Z" if a.last_run else None,
            "next_run": a.next_run,
            "cycle_seconds": a.cycle_seconds,
            "last_result": a.last_result,
            "error_message": a.error_message,
        }
        for a in agents
    ]


@router.post("/agents/start")
def start_agent(body: AgentAction, db: Session = Depends(get_db)):
    """Start an agent — sets status to 'running'."""

    agent = db.query(AgentConfig).filter(AgentConfig.agent_id == body.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {body.agent_id} not found")

    agent.status = "running"
    agent.last_run = datetime.now(timezone.utc)
    agent.error_message = None
    db.commit()

    return {
        "message": f"Agent '{agent.name}' started",
        "agent_id": agent.agent_id,
        "status": agent.status,
    }


@router.post("/agents/stop")
def stop_agent(body: AgentAction, db: Session = Depends(get_db)):
    """Stop an agent — sets status to 'stopped'."""

    agent = db.query(AgentConfig).filter(AgentConfig.agent_id == body.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {body.agent_id} not found")

    agent.status = "stopped"
    db.commit()

    return {
        "message": f"Agent '{agent.name}' stopped",
        "agent_id": agent.agent_id,
        "status": agent.status,
    }


@router.post("/agents/start-all")
def start_all_agents(db: Session = Depends(get_db)):
    """Start all agents."""
    agents = db.query(AgentConfig).all()
    for a in agents:
        a.status = "running"
        a.last_run = datetime.now(timezone.utc)
        a.error_message = None
    db.commit()
    return {"message": f"All {len(agents)} agents started"}


@router.post("/agents/stop-all")
def stop_all_agents(db: Session = Depends(get_db)):
    """Stop all agents."""
    agents = db.query(AgentConfig).all()
    for a in agents:
        a.status = "stopped"
    db.commit()
    return {"message": f"All {len(agents)} agents stopped"}
