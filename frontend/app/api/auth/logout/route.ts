import { NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, revokeSession } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(adminSessionCookie.name)?.value;
  if (token) {
    await revokeSession(token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookie.name, "", {
    ...adminSessionCookie.options,
    maxAge: 0,
  });
  return response;
}
