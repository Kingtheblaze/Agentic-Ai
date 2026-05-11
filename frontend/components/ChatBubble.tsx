"use client";

import React from "react";
import {
  Bot,
  User,
  GraduationCap,
  Zap,
  Tag,
  AlertTriangle,
  Clock,
  FileText,
  Hash,
} from "lucide-react";

// ──────────────────────────── Types ──────────────────────────────────────────
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  agent?: string;
  metadata?: {
    category?: string;
    urgency?: string;
    summary?: string;
    estimated_resolution?: string;
    ticket_id?: string;
    sources?: { source: string; page: string | number }[];
    documents_retrieved?: number;
    parse_error?: boolean;
  };
}

// ──────────────────────────── Urgency Badge ──────────────────────────────────
function UrgencyBadge({ urgency }: { urgency: string }) {
  const colors: Record<string, string> = {
    critical: "border-red-500/30 bg-red-500/10 text-red-400",
    high: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    medium: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    low: "border-green-500/30 bg-green-500/10 text-green-400",
  };
  const colorClass = colors[urgency.toLowerCase()] || colors.medium;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${colorClass}`}
    >
      <AlertTriangle className="h-3 w-3" />
      {urgency}
    </span>
  );
}

// ──────────────────────────── Metadata Card ──────────────────────────────────
function MetadataCard({ metadata }: { metadata: NonNullable<Message["metadata"]> }) {
  const isTriage = !!metadata.category;
  const isAcademic = !!metadata.sources && metadata.sources.length > 0;

  if (!isTriage && !isAcademic) return null;

  return (
    <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-2">
      {isTriage && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {metadata.ticket_id && (
              <span className="inline-flex items-center gap-1 rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-mono text-brand-300">
                <Hash className="h-3 w-3" />
                {metadata.ticket_id}
              </span>
            )}
            {metadata.category && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-slate-300">
                <Tag className="h-3 w-3" />
                {metadata.category}
              </span>
            )}
            {metadata.urgency && <UrgencyBadge urgency={metadata.urgency} />}
            {metadata.estimated_resolution && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-slate-400">
                <Clock className="h-3 w-3" />
                {metadata.estimated_resolution}
              </span>
            )}
          </div>
          {metadata.summary && (
            <p className="text-xs text-slate-400 italic">
              &ldquo;{metadata.summary}&rdquo;
            </p>
          )}
        </>
      )}

      {isAcademic && metadata.sources && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400">
            Sources:
          </span>
          {metadata.sources.map((src, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-400"
            >
              <FileText className="h-3 w-3" />
              {src.source}
              {src.page !== "N/A" && ` p.${src.page}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────── Chat Bubble ─────────────────────────────────────
export function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-3 px-2 py-3 animate-slide-up ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? "bg-gradient-to-br from-slate-600 to-slate-700"
            : "bg-gradient-to-br from-brand-500 to-purple-500"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Agent label */}
        {!isUser && message.agent && (
          <div className="mb-1.5 flex items-center gap-1.5">
            {message.agent.toLowerCase().includes("academic") ? (
              <GraduationCap className="h-3 w-3 text-brand-400" />
            ) : message.agent.toLowerCase().includes("triage") ? (
              <Zap className="h-3 w-3 text-amber-400" />
            ) : null}
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {message.agent}
            </span>
          </div>
        )}

        {/* Content */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-tr-sm"
              : "glass-card text-slate-200 rounded-tl-sm"
          }`}
        >
          {/* Render content with basic line breaks */}
          {message.content.split("\n").map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < message.content.split("\n").length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>

        {/* Metadata */}
        {!isUser && message.metadata && (
          <MetadataCard metadata={message.metadata} />
        )}

        {/* Timestamp */}
        <p
          className={`mt-1 text-[10px] text-slate-500 ${
            isUser ? "text-right" : "text-left"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
