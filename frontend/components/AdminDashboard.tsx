"use client";

import React, { useCallback, useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Bot,
  Shield,
  Loader2,
  Trash2,
  Database,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UploadResult {
  filename: string;
  chunks_stored: number;
  status: string;
}

export function AdminDashboard({
  adminName,
  adminEmail,
}: {
  adminName: string;
  adminEmail: string;
}) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [uploads, setUploads] = useState<
    {
      file: File;
      status: "pending" | "uploading" | "success" | "error";
      result?: UploadResult;
      error?: string;
    }[]
  >([]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    setUploads((prev) => {
      const existingNames = new Set(prev.map((upload) => upload.file.name));
      const nextFiles = Array.from(files).filter(
        (file) =>
          file.name.toLowerCase().endsWith(".pdf") &&
          !existingNames.has(file.name)
      );

      return [
        ...prev,
        ...nextFiles.map((file) => ({ file, status: "pending" as const })),
      ];
    });
  }, []);

  const uploadFile = async (index: number) => {
    const upload = uploads[index];
    if (!upload || upload.status === "uploading") return;

    setUploads((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, status: "uploading", error: undefined }
          : item
      )
    );

    try {
      const formData = new FormData();
      formData.append("file", upload.file);

      const response = await fetch("/api/backend/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Upload failed",
          detail: "Upload failed",
        }));
        throw new Error(errorData.error || errorData.detail || "Upload failed");
      }

      const result: UploadResult = await response.json();

      setUploads((prev) =>
        prev.map((item, itemIndex) =>
          itemIndex === index ? { ...item, status: "success", result } : item
        )
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown upload error";

      setUploads((prev) =>
        prev.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, status: "error", error: message }
            : item
        )
      );
    }
  };

  const uploadAll = async () => {
    for (let index = 0; index < uploads.length; index += 1) {
      if (
        uploads[index].status === "pending" ||
        uploads[index].status === "error"
      ) {
        await uploadFile(index);
      }
    }
  };

  const signOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  const pendingCount = uploads.filter(
    (upload) => upload.status === "pending" || upload.status === "error"
  ).length;

  return (
    <div className="min-h-screen">
      <header className="glass-card sticky top-0 z-50 flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all hover:border-brand-500/30 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 shadow-lg shadow-brand-500/25">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Admin <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-xs text-slate-400">
              Signed in as {adminName} · {adminEmail}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/5 px-4 py-2 md:flex">
            <Database className="h-4 w-4 text-brand-400" />
            <span className="text-xs text-brand-300">MongoDB Atlas</span>
          </div>
          <button
            onClick={signOut}
            disabled={isSigningOut}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-white disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              {isSigningOut ? "Signing Out..." : "Logout"}
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-white">Upload Documents</h2>
          <p className="mt-2 text-slate-400">
            Upload PDFs to expand the OmniDesk knowledge base. Each document is
            extracted, chunked, embedded, and stored for grounded retrieval.
          </p>
        </div>

        <div className="mb-8 glass-card p-6 animate-slide-up">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            RAG Ingestion Pipeline
          </h3>
          <div className="flex flex-wrap items-center justify-between gap-4">
            {[
              { icon: FileText, label: "PDF Upload", color: "text-blue-400" },
              { icon: Bot, label: "Text Extraction", color: "text-brand-400" },
              { icon: Database, label: "Chunk & Embed", color: "text-purple-400" },
              { icon: CheckCircle2, label: "Vector Store", color: "text-green-400" },
            ].map((step, index) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 ${step.color}`}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-slate-300">
                    {step.label}
                  </span>
                </div>
                {index < 3 && (
                  <div className="hidden h-px w-12 bg-gradient-to-r from-white/10 to-white/5 md:block" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div
          className={`drop-zone mb-6 cursor-pointer animate-slide-up ${isDragging ? "active" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFiles(event.dataTransfer.files);
          }}
          onClick={() => document.getElementById("file-input")?.click()}
          id="upload-drop-zone"
        >
          <input
            type="file"
            id="file-input"
            className="hidden"
            accept=".pdf"
            multiple
            onChange={(event) => handleFiles(event.target.files)}
          />
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10">
              <Upload className="h-8 w-8 text-brand-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                Drop PDFs here or click to browse
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Supports multiple files · PDF format only
              </p>
            </div>
          </div>
        </div>

        {uploads.length > 0 && (
          <div className="space-y-3 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-300">
                Upload Queue ({uploads.length} files)
              </h3>
              {pendingCount > 0 && (
                <button
                  onClick={uploadAll}
                  className="btn-primary !px-4 !py-2 text-sm"
                  id="upload-all-button"
                >
                  Upload All ({pendingCount})
                </button>
              )}
            </div>

            {uploads.map((upload, index) => (
              <div
                key={`${upload.file.name}-${index}`}
                className="glass-card flex items-center gap-4 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                  <FileText className="h-5 w-5 text-red-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {upload.file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(upload.file.size / 1024).toFixed(1)} KB
                    {upload.result &&
                      ` · ${upload.result.chunks_stored} chunks stored`}
                    {upload.error && (
                      <span className="text-red-400"> · {upload.error}</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {upload.status === "pending" && (
                    <button
                      onClick={() => uploadFile(index)}
                      className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-300 transition-all hover:bg-brand-500/20"
                    >
                      Upload
                    </button>
                  )}
                  {upload.status === "uploading" && (
                    <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
                  )}
                  {upload.status === "success" && (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  )}
                  {upload.status === "error" && (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                  <button
                    onClick={() =>
                      setUploads((prev) =>
                        prev.filter((_, itemIndex) => itemIndex !== index)
                      )
                    }
                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 grid gap-4 md:grid-cols-3 animate-slide-up">
          {[
            {
              title: "Knowledge Agent",
              desc: "Uses uploaded PDFs to answer grounded document questions with retrieval and source pages.",
              icon: "KB",
              color: "border-brand-500/20 bg-brand-500/5",
            },
            {
              title: "Triage Agent",
              desc: "Classifies IT issues with structured metadata extraction: category, urgency, and ticket ID.",
              icon: "IT",
              color: "border-amber-500/20 bg-amber-500/5",
            },
            {
              title: "Supervisor",
              desc: "Routes each message to the right specialist so the main chat stays simple for students.",
              icon: "AI",
              color: "border-purple-500/20 bg-purple-500/5",
            },
          ].map((card) => (
            <div
              key={card.title}
              className={`glass-card-hover border p-5 ${card.color}`}
            >
              <div className="mb-3 text-sm font-semibold tracking-[0.18em] text-slate-300">
                {card.icon}
              </div>
              <h4 className="text-sm font-semibold text-white">{card.title}</h4>
              <p className="mt-1 text-xs text-slate-400">{card.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
