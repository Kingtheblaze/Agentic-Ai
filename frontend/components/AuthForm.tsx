"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      router.push("/admin");
      router.refresh();
    } catch (submissionError: unknown) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Authentication failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.2fr_0.9fr]">
          <section className="glass-card hidden p-10 lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-300">
              <ShieldCheck className="h-4 w-4" />
              Protected Admin
            </div>
            <h1 className="mt-8 max-w-md text-4xl font-bold tracking-tight text-white">
              Keep the document pipeline private for your department admins.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-400">
              Admin access is now gated behind a real login flow, and the PDF
              upload route is protected on the server as well.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {[
                "One-time bootstrap signup for the first admin",
                "Server-side session protection for /admin",
                "Upload API locked behind admin login",
                "Ready for demos and department handoff",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card p-8 sm:p-10">
            <div className="mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 shadow-lg shadow-brand-500/25">
                <LockKeyhole className="h-6 w-6 text-white" />
              </div>
              <h2 className="mt-6 text-3xl font-bold text-white">
                {isSignup ? "Create Admin Account" : "Admin Login"}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                {isSignup
                  ? "Create the first protected admin account for OmniDesk."
                  : "Sign in to manage uploads and the admin dashboard."}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {isSignup && (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">
                    Full name
                  </span>
                  <input
                    className="input-glass"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Department admin"
                    required
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Email address
                </span>
                <input
                  className="input-glass"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@department.edu"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </span>
                <input
                  className="input-glass"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                />
              </label>

              {isSignup && (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">
                    Confirm password
                  </span>
                  <input
                    className="input-glass"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat password"
                    minLength={8}
                    required
                  />
                </label>
              )}

              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex w-full items-center justify-center gap-2"
              >
                {isLoading ? "Please wait..." : isSignup ? "Create Admin" : "Sign In"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 text-sm text-slate-400">
              {isSignup ? (
                <>
                  Setup already finished?{" "}
                  <Link className="text-brand-300 hover:text-white" href="/login">
                    Sign in instead
                  </Link>
                </>
              ) : (
                <>
                  Need the first admin account?{" "}
                  <Link className="text-brand-300 hover:text-white" href="/signup">
                    Open signup
                  </Link>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
