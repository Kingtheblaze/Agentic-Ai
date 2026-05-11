# OmniDesk: Multi-Agent RAG Support System

OmniDesk is a premium, AI-powered help desk system designed for university Computer Science departments. It leverages a multi-agent architecture to handle academic inquiries and IT support issues autonomously.

---

## 🚀 Key Features

- **Multi-Agent Orchestration**: Uses LangGraph to route queries between specialized agents.
- **Academic RAG Agent**: Answers questions about syllabi, courses, and policies using RAG (Retrieval-Augmented Generation).
- **IT Triage Agent**: Extracts structured metadata (Category, Urgency) from technical issues and provides troubleshooting steps.
- **Premium UI/UX**: Built with Next.js 14, Tailwind CSS, and glassmorphism design for a state-of-the-art experience.
- **Vector Search**: Integrated with MongoDB Atlas Vector Search and Google Gemini embeddings.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Python, FastAPI, LangGraph, LangChain.
- **AI Models**: Google Gemini 2.0 Flash (Reasoning/Orchestration), Google Generative AI Embeddings.
- **Database/Vector Store**: MongoDB Atlas.

---

## 📁 Project Structure

```text
OmniDesk/
├── backend/
│   ├── main.py                # FastAPI server entry point
│   ├── requirements.txt       # Python dependencies
│   ├── agents/
│   │   ├── supervisor.py      # LangGraph router/orchestrator
│   │   ├── academic.py        # RAG-based Academic Agent
│   │   └── triage.py          # Structured IT Triage Agent
│   └── core/
│       └── rag.py             # PDF ingestion & Vector Store logic
└── frontend/
    ├── app/                   # Next.js App Router (Chat & Admin)
    ├── components/            # Reusable UI components
    └── tailwind.config.ts     # Custom design tokens
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Atlas Account
- Google AI Studio (Gemini) API Key

### 2. MongoDB Atlas Vector Search Index
Create a **Vector Search Index** on your `documents` collection with the following JSON configuration:
```json
{
  "fields": [{
    "type": "vector",
    "path": "embedding",
    "numDimensions": 768,
    "similarity": "cosine"
  }]
}
```
**Index Name**: `vector_index`

### 3. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file from `.env.example` and fill in your keys:
   ```env
   GOOGLE_API_KEY=your_gemini_api_key
   MONGODB_ATLAS_URI=your_mongodb_connection_string
   MONGODB_DB_NAME=omnidesk
   MONGODB_COLLECTION_NAME=documents
   MONGODB_VECTOR_INDEX_NAME=vector_index
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

### 4. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Create a `.env.local` file:
   ```env
   BACKEND_URL=http://localhost:8000
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🎯 How to Use
1. **Populate Knowledge Base**: Go to the **Admin Dashboard** (`/admin`) and upload syllabus/policy PDFs.
2. **Chat**: Use the main chat interface to ask questions like:
   - *"What are the prerequisites for Data Structures?"*
   - *"I can't access the lab WiFi on my laptop."*
3. **Monitor Agents**: Watch the UI labels to see which agent (Academic or Triage) is handling your request.

---

## 📜 License
This project was built for the Google AI Hackathon.
