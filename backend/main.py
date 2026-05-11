"""
OmniDesk — FastAPI Backend Server
Provides /chat and /upload endpoints for the Multi-Agent RAG Support System.
"""

import os
import uuid
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.supervisor import invoke_supervisor
from core.rag import process_and_store_pdf

load_dotenv()

app = FastAPI(
    title="OmniDesk API",
    description="Multi-Agent RAG Support System for University CS Department",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────── Request / Response Models ────────────────────────
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    agent: str
    metadata: Optional[dict] = None
    session_id: str


class UploadResponse(BaseModel):
    filename: str
    chunks_stored: int
    status: str


# ──────────────────────────── Health ──────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "service": "OmniDesk API",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
    }


# ──────────────────────────── Chat ────────────────────────────────────────────
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Accepts a user message, routes it through the LangGraph supervisor,
    and returns the agent's response.
    """
    session_id = request.session_id or str(uuid.uuid4())

    try:
        result = await invoke_supervisor(request.message, session_id)
        return ChatResponse(
            reply=result["reply"],
            agent=result["agent"],
            metadata=result.get("metadata"),
            session_id=session_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


# ──────────────────────────── Upload ──────────────────────────────────────────
@app.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Accepts a PDF, splits it into chunks, generates embeddings via
    Google Generative AI, and stores vectors in MongoDB Atlas.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    try:
        contents = await file.read()
        chunks_stored = await process_and_store_pdf(contents, file.filename)
        return UploadResponse(
            filename=file.filename,
            chunks_stored=chunks_stored,
            status="success",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
