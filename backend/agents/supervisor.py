"""
OmniDesk - Supervisor Agent (LangGraph Orchestrator)
Routes incoming student queries to the Knowledge Agent or Triage Agent
using a Google Gemini-powered classifier.
"""

import os
from typing import Any, Literal, TypedDict

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph

from agents.academic import run_academic_agent
from agents.triage import run_triage_agent
from core.network import disable_dead_local_proxies

load_dotenv()
disable_dead_local_proxies()


class SupervisorState(TypedDict):
  user_message: str
  session_id: str
  route: str
  reply: str
  agent: str
  metadata: dict | None


ROUTER_SYSTEM_PROMPT = """You are a routing classifier for a university Computer Science department help desk called OmniDesk.

Given a student's message, classify it into EXACTLY one of these categories:
- "academic" - Questions about uploaded PDFs, resumes, handbooks, syllabi, schedules, grading policies, prerequisites, professors, academic policies, registration, or any document-grounded or curriculum-related topic.
- "triage" - IT support issues, technical problems, lab access, software installation, network issues, account lockouts, hardware failures, or any operational IT ticket.

Respond with ONLY the single word: academic OR triage
Do not add any explanation or punctuation."""


async def route_message(state: SupervisorState) -> SupervisorState:
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
    classification = "academic"

  return {**state, "route": classification}


async def academic_node(state: SupervisorState) -> SupervisorState:
  result = await run_academic_agent(state["user_message"], state["session_id"])
  return {
    **state,
    "reply": result["reply"],
    "agent": "Knowledge Agent",
    "metadata": result.get("metadata"),
  }


async def triage_node(state: SupervisorState) -> SupervisorState:
  result = await run_triage_agent(state["user_message"], state["session_id"])
  return {
    **state,
    "reply": result["reply"],
    "agent": "Triage Agent",
    "metadata": result.get("metadata"),
  }


def decide_route(state: SupervisorState) -> Literal["academic_node", "triage_node"]:
  if state.get("route") == "triage":
    return "triage_node"
  return "academic_node"


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


_supervisor_graph = build_supervisor_graph()


async def invoke_supervisor(message: str, session_id: str) -> dict[str, Any]:
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
