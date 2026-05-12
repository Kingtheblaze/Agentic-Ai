import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { adminSessionCookie, getSessionUser } from "@/lib/admin-auth";

export default async function LoginPage() {
  const existingSession = await getSessionUser(
    cookies().get(adminSessionCookie.name)?.value
  );

  if (existingSession) {
    redirect("/admin");
  }

  return <AuthForm mode="login" />;
}
