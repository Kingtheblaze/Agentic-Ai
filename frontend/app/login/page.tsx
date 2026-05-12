import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import {
  adminSessionCookie,
  getSessionUser,
  isSignupOpen,
} from "@/lib/admin-auth";

export default async function LoginPage() {
  const [signupOpen, existingSession] = await Promise.all([
    isSignupOpen(),
    getSessionUser(cookies().get(adminSessionCookie.name)?.value),
  ]);

  if (existingSession) {
    redirect("/admin");
  }

  if (signupOpen) {
    redirect("/signup");
  }

  return <AuthForm mode="login" />;
}
