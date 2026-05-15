import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { normalizeRole, ROLES } from "@/lib/roles";
import { ClientTeamPageClient } from "./ClientTeamPageClient";

export const metadata = { title: "Your team" };

export default async function ClientTeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard/client/team");
  if (normalizeRole(session.user.role) !== ROLES.CLIENT) {
    redirect("/dashboard");
  }
  return <ClientTeamPageClient />;
}
