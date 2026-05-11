"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatBubble, Message } from "@/components/ChatBubble";
import {
  Send,
  Sparkles,
  GraduationCap,
  Wrench,
  Bot,
  Zap,
  BookOpen,
  Settings,
} from "lucide-react";
import Link from "next/link";

// ──────────────────────────── Quick Prompts ──────────────────────────────────
const QUICK_PROMPTS = [
  {
    icon: GraduationCap,
    label: "Course Info",
    prompt: "What are the prerequisites for CS 301 Data Structures?",
  },
  {
    icon: BookOpen,
    label: "Syllabus",
    prompt: "Can you show me the grading policy for CS 101 Intro to Programming?",
  },
  {
    icon: Wrench,
    label: "IT Issue",
    prompt: "I can't connect to the campus WiFi on my laptop in the CS lab.",
  },
  {
    icon: Settings,
    label: "Account Help",
    prompt: "I'm locked out of my university email account and have an assignment due tonight.",
  },
];

// ──────────────────────────── Page Component ─────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content.trim(),
          session_id: sessionId,
        }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();

      if (data.session_id) setSessionId(data.session_id);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
        agent: data.agent,
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I apologize, but I'm having trouble connecting to the server. Please ensure the backend is running and try again.",
        timestamp: new Date(),
        agent: "System",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex h-screen flex-col">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="glass-card sticky top-0 z-50 flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 shadow-lg shadow-brand-500/25">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Omni<span className="gradient-text">Desk</span>
            </h1>
            <p className="text-xs text-slate-400">
              AI-Powered University Support
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-green-400">
              Agents Online
            </span>
          </div>
          <Link
            href="/admin"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:border-brand-500/30 hover:bg-brand-500/10 hover:text-white"
          >
            Admin Panel
          </Link>
        </div>
      </header>

      {/* ─── Chat Area ──────────────────────────────────────────────────── */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 md:px-8"
      >
        <div className="mx-auto max-w-3xl space-y-1">
          {messages.length === 0 ? (
            /* ─── Empty State ──────────────────────────────────────────── */
            <div className="flex min-h-[60vh] flex-col items-center justify-center animate-fade-in">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 shadow-2xl shadow-brand-500/30">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-white">
                Welcome to OmniDesk
              </h2>
              <p className="mb-8 max-w-md text-center text-sm text-slate-400">
                Your AI-powered help desk for the CS department. Ask about
                courses, syllabi, policies — or report IT issues for instant
                triage.
              </p>

              {/* Quick prompt cards */}
              <div className="grid w-full max-w-xl grid-cols-2 gap-3">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => sendMessage(qp.prompt)}
                    className="glass-card-hover group flex items-start gap-3 p-4 text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400 transition-colors group-hover:bg-brand-500/20">
                      <qp.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {qp.label}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">
                        {qp.prompt}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Agent badges */}
              <div className="mt-10 flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/5 px-4 py-2">
                  <GraduationCap className="h-4 w-4 text-brand-400" />
                  <span className="text-xs text-brand-300">
                    Academic Agent
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span className="text-xs text-amber-300">Triage Agent</span>
                </div>
              </div>
            </div>
          ) : (
            /* ─── Message Thread ───────────────────────────────────────── */
            messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)
          )}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 animate-fade-in px-2 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-500">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="glass-card px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── Input Bar ──────────────────────────────────────────────────── */}
      <div className="border-t border-white/5 bg-surface-900/80 backdrop-blur-xl px-4 py-4 md:px-8">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-center gap-3"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about courses, policies, or report an IT issue..."
              className="input-glass pr-12"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="btn-primary flex items-center gap-2 !px-5 !py-3"
            id="send-button"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-slate-500">
          Powered by Google Gemini · Multi-Agent RAG System · OmniDesk v1.0
        </p>
      </div>
    </div>
  );
}
