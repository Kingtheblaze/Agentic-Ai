"""
OmniDesk — RAG Pipeline
Processes uploaded PDFs: splits text into chunks, generates embeddings
via Google Generative AI, and stores vectors in MongoDB Atlas Vector Search.
"""

import os
import io
from datetime import datetime

from dotenv import load_dotenv
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_mongodb import MongoDBAtlasVectorSearch
from pymongo import MongoClient

load_dotenv()


def _get_mongo_collection():
    """Returns the MongoDB collection for storing document vectors."""
    mongo_uri = os.getenv("MONGODB_ATLAS_URI", "")
    db_name = os.getenv("MONGODB_DB_NAME", "omnidesk")
    collection_name = os.getenv("MONGODB_COLLECTION_NAME", "documents")

    if not mongo_uri:
        raise ValueError(
            "MONGODB_ATLAS_URI environment variable is not set. "
            "Please configure your MongoDB Atlas connection string."
        )

    client = MongoClient(mongo_uri)
    return client[db_name][collection_name]


def _extract_text_from_pdf(pdf_bytes: bytes) -> list[dict]:
    """Extracts text from each page of a PDF, returning a list of page dicts."""
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text and text.strip():
            pages.append({"text": text, "page": i + 1})
    return pages


def _split_pages_into_chunks(
    pages: list[dict], filename: str
) -> list[dict]:
    """Splits extracted pages into smaller overlapping chunks for embedding."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = []
    for page_data in pages:
        page_chunks = splitter.split_text(page_data["text"])
        for chunk_text in page_chunks:
            chunks.append({
                "text": chunk_text,
                "metadata": {
                    "source": filename,
                    "page": page_data["page"],
                    "uploaded_at": datetime.utcnow().isoformat(),
                },
            })
    return chunks


async def process_and_store_pdf(pdf_bytes: bytes, filename: str) -> int:
    """
    End-to-end RAG ingestion pipeline:
    1. Extract text from PDF
    2. Split into chunks
    3. Generate embeddings via Google Generative AI
    4. Store in MongoDB Atlas Vector Search

    Returns the number of chunks stored.
    """
    # Step 1: Extract
    pages = _extract_text_from_pdf(pdf_bytes)
    if not pages:
        raise ValueError("No extractable text found in the uploaded PDF.")

    # Step 2: Split
    chunks = _split_pages_into_chunks(pages, filename)
    if not chunks:
        raise ValueError("Text splitting produced zero chunks.")

    # Step 3 & 4: Embed and Store
    collection = _get_mongo_collection()
    index_name = os.getenv("MONGODB_VECTOR_INDEX_NAME", "vector_index")

    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=os.getenv("GOOGLE_API_KEY"),
    )

    vector_store = MongoDBAtlasVectorSearch(
        collection=collection,
        embedding=embeddings,
        index_name=index_name,
        text_key="text",
        embedding_key="embedding",
    )

    texts = [c["text"] for c in chunks]
    metadatas = [c["metadata"] for c in chunks]

    vector_store.add_texts(texts=texts, metadatas=metadatas)

    return len(chunks)
