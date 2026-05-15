import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { normalizeRole, ROLES } from "@/lib/roles";
import { AdminUsersClient } from "./AdminUsersClient";

export const metadata = { title: "Admin · Users" };

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard/admin/users");
  if (normalizeRole(session.user.role) !== ROLES.ADMIN) {
    redirect("/dashboard");
  }
  return <AdminUsersClient />;
}
