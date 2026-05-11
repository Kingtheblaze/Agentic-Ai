"""
OmniDesk — Supervisor Agent (LangGraph Orchestrator)
Routes incoming student queries to the Academic Agent or Triage Agent
using a Google Gemini–powered classifier.
"""

import os
from typing import Any, TypedDict, Literal

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END

from agents.academic import run_academic_agent
from agents.triage import run_triage_agent

load_dotenv()

# ──────────────────────────── State Definition ────────────────────────────────
class SupervisorState(TypedDict):
    user_message: str
    session_id: str
    route: str
    reply: str
    agent: str
    metadata: dict | None


# ──────────────────────────── Router Node ─────────────────────────────────────
ROUTER_SYSTEM_PROMPT = """You are a routing classifier for a university Computer Science department help desk called OmniDesk.

Given a student's message, classify it into EXACTLY one of these categories:
- "academic" — Questions about courses, syllabi, schedules, grading policies, prerequisites, professors, academic policies, registration, or any curriculum-related topic.
- "triage" — IT support issues, technical problems, lab access, software installation, network issues, account lockouts, hardware failures, or any operational/IT ticket.

Respond with ONLY the single word: academic OR triage
Do not add any explanation or punctuation."""


async def route_message(state: SupervisorState) -> SupervisorState:
    """Uses Gemini to classify the user message into academic or triage."""
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0,
    )

    response = await llm.ainvoke([
        SystemMessage(content=ROUTER_SYSTEM_PROMPT),
        HumanMessage(content=state["user_message"]),
    ])

    classification = response.content.strip().lower()

    if classification not in ("academic", "triage"):
        classification = "academic"  # Default fallback

    return {**state, "route": classification}


# ──────────────────────────── Agent Nodes ─────────────────────────────────────
async def academic_node(state: SupervisorState) -> SupervisorState:
    """Delegates to the Academic Agent for syllabus/course questions."""
    result = await run_academic_agent(state["user_message"], state["session_id"])
    return {
        **state,
        "reply": result["reply"],
        "agent": "Academic Agent",
        "metadata": result.get("metadata"),
    }


async def triage_node(state: SupervisorState) -> SupervisorState:
    """Delegates to the Triage Agent for IT issue classification."""
    result = await run_triage_agent(state["user_message"], state["session_id"])
    return {
        **state,
        "reply": result["reply"],
        "agent": "Triage Agent",
        "metadata": result.get("metadata"),
    }


# ──────────────────────────── Conditional Edge ────────────────────────────────
def decide_route(state: SupervisorState) -> Literal["academic_node", "triage_node"]:
    """Conditional edge: inspects 'route' and picks the correct agent node."""
    if state.get("route") == "triage":
        return "triage_node"
    return "academic_node"


# ──────────────────────────── Build Graph ─────────────────────────────────────
def build_supervisor_graph() -> StateGraph:
    graph = StateGraph(SupervisorState)

    graph.add_node("router", route_message)
    graph.add_node("academic_node", academic_node)
    graph.add_node("triage_node", triage_node)

    graph.set_entry_point("router")

    graph.add_conditional_edges(
        "router",
        decide_route,
        {
            "academic_node": "academic_node",
            "triage_node": "triage_node",
        },
    )

    graph.add_edge("academic_node", END)
    graph.add_edge("triage_node", END)

    return graph.compile()


# Compile graph once at module level
_supervisor_graph = build_supervisor_graph()


# ──────────────────────────── Public API ──────────────────────────────────────
async def invoke_supervisor(message: str, session_id: str) -> dict[str, Any]:
    """
    Entry point called by FastAPI.
    Returns dict with keys: reply, agent, metadata.
    """
    initial_state: SupervisorState = {
        "user_message": message,
        "session_id": session_id,
        "route": "",
        "reply": "",
        "agent": "",
        "metadata": None,
    }

    result = await _supervisor_graph.ainvoke(initial_state)

    return {
        "reply": result["reply"],
        "agent": result["agent"],
        "metadata": result.get("metadata"),
    }
