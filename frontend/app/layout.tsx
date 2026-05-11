import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniDesk — AI-Powered University Support",
  description:
    "Multi-Agent RAG Support System for university Computer Science departments. Get instant answers to academic questions and IT support tickets powered by Google Gemini.",
  keywords: [
    "university support",
    "AI help desk",
    "computer science",
    "RAG",
    "multi-agent",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-900 antialiased bg-grid">
        {/* Ambient glow orbs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-600/10 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-brand-500/5 blur-[150px]" />
        </div>

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
