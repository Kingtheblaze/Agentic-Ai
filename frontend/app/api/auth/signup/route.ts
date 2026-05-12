import { NextRequest, NextResponse } from "next/server";
import {
  adminSessionCookie,
  createAdmin,
  createSession,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name : "";
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name.trim() || !email.trim() || password.length < 8) {
    return NextResponse.json(
      { error: "Name, email, and an 8+ character password are required." },
      { status: 400 }
    );
  }

  try {
    const user = await createAdmin({ name, email, password });
    const token = await createSession(user.id);
    const response = NextResponse.json({
      ok: true,
      user: { name: user.name, email: user.email },
    });

    response.cookies.set(
      adminSessionCookie.name,
      token,
      adminSessionCookie.options
    );
    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create admin.",
      },
      { status: 409 }
    );
  }
}
