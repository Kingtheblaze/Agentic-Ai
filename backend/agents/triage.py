"""
OmniDesk — Triage Agent
Classifies IT support issues, extracts structured metadata (Category, Urgency),
and generates a professional support response.
"""

import json
import os
from typing import Any

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()

TRIAGE_SYSTEM_PROMPT = """You are the IT Triage Agent for OmniDesk, the official help desk of a university Computer Science department.

Your job is to:
1. Classify the student's IT issue.
2. Extract structured metadata.
3. Provide a helpful initial response with troubleshooting steps.

You MUST respond in the following JSON format (and ONLY this JSON, no markdown fences):
{
  "category": "<one of: Network, Hardware, Software, Account Access, Lab Equipment, Email, Printing, Other>",
  "urgency": "<one of: Low, Medium, High, Critical>",
  "summary": "<one-line summary of the issue>",
  "response": "<a friendly, detailed response with numbered troubleshooting steps and next actions>",
  "estimated_resolution": "<estimated time to resolve, e.g. '1-2 hours', '24-48 hours'>"
}

Urgency guidelines:
- Critical: System-wide outages, security breaches, exam-blocking issues
- High: Cannot access required resources for imminent deadlines
- Medium: Degraded functionality but workarounds exist
- Low: Convenience issues, feature requests, general inquiries
"""


async def run_triage_agent(message: str, session_id: str) -> dict[str, Any]:
    """
    Uses Gemini to classify an IT issue and extract structured JSON metadata.
    """
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0,
    )

    response = await llm.ainvoke([
        SystemMessage(content=TRIAGE_SYSTEM_PROMPT),
        HumanMessage(content=message),
    ])

    raw = response.content.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        lines = raw.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        raw = "\n".join(lines)

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback: return the raw response as-is
        return {
            "reply": raw,
            "metadata": {
                "category": "Other",
                "urgency": "Medium",
                "parse_error": True,
            },
        }

    return {
        "reply": parsed.get("response", raw),
        "metadata": {
            "category": parsed.get("category", "Other"),
            "urgency": parsed.get("urgency", "Medium"),
            "summary": parsed.get("summary", ""),
            "estimated_resolution": parsed.get("estimated_resolution", "Unknown"),
            "ticket_id": f"OD-{session_id[:8].upper()}",
        },
    }
