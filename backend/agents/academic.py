"""
OmniDesk - Academic Agent
Answers document-grounded questions using RAG retrieval
from the MongoDB Atlas Vector Store.
"""

import os
from typing import Any

import certifi
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import (
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
)
from langchain_mongodb import MongoDBAtlasVectorSearch
from pymongo import MongoClient

from core.network import disable_dead_local_proxies

load_dotenv()
disable_dead_local_proxies()

ACADEMIC_SYSTEM_PROMPT = """You are the Knowledge Support Agent for OmniDesk, the official help desk of a university Computer Science department.

Your role:
- Answer questions about uploaded documents, resumes, courses, syllabi, grading policies, schedules, prerequisites, and academic regulations.
- Use ONLY the retrieved context below to formulate accurate answers.
- If the context does not contain enough information, say so honestly and suggest the user contact the relevant department owner.
- Be friendly, professional, and concise.
- Format your answers with clear structure using bullet points or numbered lists when appropriate.

Retrieved Context:
{context}
"""


def _get_retriever():
  mongo_uri = os.getenv("MONGODB_ATLAS_URI", "")
  db_name = os.getenv("MONGODB_DB_NAME", "omnidesk")
  collection_name = os.getenv("MONGODB_COLLECTION_NAME", "documents")
  index_name = os.getenv("MONGODB_VECTOR_INDEX_NAME", "vector_index")

  if not mongo_uri:
    return None

  client = MongoClient(mongo_uri, tls=True, tlsCAFile=certifi.where())
  collection = client[db_name][collection_name]

  embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
  )

  vector_store = MongoDBAtlasVectorSearch(
    collection=collection,
    embedding=embeddings,
    index_name=index_name,
    text_key="text",
    embedding_key="embedding",
  )

  return vector_store.as_retriever(search_kwargs={"k": 5})


async def run_academic_agent(message: str, session_id: str) -> dict[str, Any]:
  llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.3,
  )

  context_text = "No documents have been uploaded to the knowledge base yet."
  source_docs = []

  retriever = _get_retriever()
  if retriever:
    try:
      docs = await retriever.ainvoke(message)
      if docs:
        source_docs = [
          {
            "source": doc.metadata.get("source", "unknown"),
            "page": doc.metadata.get("page", "N/A"),
          }
          for doc in docs
        ]
        context_text = "\n\n---\n\n".join(doc.page_content for doc in docs)
    except Exception:
      context_text = "Knowledge base retrieval is temporarily unavailable."

  system_msg = ACADEMIC_SYSTEM_PROMPT.format(context=context_text)
  response = await llm.ainvoke([
    SystemMessage(content=system_msg),
    HumanMessage(content=message),
  ])

  return {
    "reply": response.content,
    "metadata": {
      "sources": source_docs,
      "documents_retrieved": len(source_docs),
    },
  }
