import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { normalizeRole, ROLES } from "@/lib/roles";
import { ManagerTeamClient } from "./ManagerTeamClient";

export const metadata = { title: "Manager · Team" };

export default async function ManagerTeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard/manager/team");
  const r = normalizeRole(session.user.role);
  if (r !== ROLES.ADMIN && r !== ROLES.MANAGER) {
    redirect("/dashboard");
  }
  return <ManagerTeamClient />;
}
