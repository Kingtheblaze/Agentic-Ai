import { NextRequest, NextResponse } from "next/server";
import {
  adminSessionCookie,
  authenticateAdmin,
  createSession,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const user = await authenticateAdmin(email, password);
  if (!user) {
    return NextResponse.json(
      { error: "Invalid admin credentials." },
      { status: 401 }
    );
  }

  const token = await createSession(user.id);
  const response = NextResponse.json({
    ok: true,
    user: { name: user.name, email: user.email },
  });

  response.cookies.set(adminSessionCookie.name, token, adminSessionCookie.options);
  return response;
}
