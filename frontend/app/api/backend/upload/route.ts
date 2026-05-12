import { NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, getSessionUser } from "@/lib/admin-auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(adminSessionCookie.name)?.value;
    const adminUser = await getSessionUser(token);

    if (!adminUser) {
      return NextResponse.json(
        { error: "Please sign in to access the admin upload route." },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/upload`, {
      method: "POST",
      headers: {
        "Content-Type": request.headers.get("Content-Type") || "",
      },
      body: request.body,
      // @ts-ignore
      duplex: "half",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        detail: "Backend returned an error during upload.",
      }));

      return NextResponse.json(
        {
          error:
            errorData.detail || "Upload failed while processing the PDF.",
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("[Upload API] Error proxying to backend:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      {
        error:
          "Failed to connect to the OmniDesk backend. Please ensure the FastAPI server is running.",
        detail: message,
      },
      { status: 502 }
    );
  }
}
