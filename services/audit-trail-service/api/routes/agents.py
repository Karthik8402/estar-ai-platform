"""Agent control endpoints — status, start, stop."""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import AgentConfig

router = APIRouter()
logger = logging.getLogger("audit-trail-service")


class AgentAction(BaseModel):
    agent_id: str


@router.get("/agents/status")
def get_agent_status(db: Session = Depends(get_db)):
    """Returns the status of all 3 AI agents."""
    try:
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

    except Exception as e:
        logger.error(f"[/agents/status] Database query failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch agent status: {str(e)}")


@router.post("/agents/start")
def start_agent(body: AgentAction, db: Session = Depends(get_db)):
    """Start an agent — sets status to 'running'."""
    try:
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

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"[/agents/start] Failed to start agent {body.agent_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to start agent: {str(e)}")


@router.post("/agents/stop")
def stop_agent(body: AgentAction, db: Session = Depends(get_db)):
    """Stop an agent — sets status to 'stopped'."""
    try:
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

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"[/agents/stop] Failed to stop agent {body.agent_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to stop agent: {str(e)}")


@router.post("/agents/start-all")
def start_all_agents(db: Session = Depends(get_db)):
    """Start all agents."""
    try:
        agents = db.query(AgentConfig).all()
        for a in agents:
            a.status = "running"
            a.last_run = datetime.now(timezone.utc)
            a.error_message = None
        db.commit()
        return {"message": f"All {len(agents)} agents started"}

    except Exception as e:
        db.rollback()
        logger.error(f"[/agents/start-all] Failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to start all agents: {str(e)}")


@router.post("/agents/stop-all")
def stop_all_agents(db: Session = Depends(get_db)):
    """Stop all agents."""
    try:
        agents = db.query(AgentConfig).all()
        for a in agents:
            a.status = "stopped"
        db.commit()
        return {"message": f"All {len(agents)} agents stopped"}

    except Exception as e:
        db.rollback()
        logger.error(f"[/agents/stop-all] Failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to stop all agents: {str(e)}")
