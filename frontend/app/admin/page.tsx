import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/AdminDashboard";
import { adminSessionCookie, getSessionUser } from "@/lib/admin-auth";

export default async function AdminPage() {
  const sessionToken = cookies().get(adminSessionCookie.name)?.value;
  const adminUser = await getSessionUser(sessionToken);

  if (!adminUser) {
    redirect("/login");
  }

  return (
    <AdminDashboard
      adminName={adminUser.name}
      adminEmail={adminUser.email}
    />
  );
}
