import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { normalizeRole, ROLES } from "@/lib/roles";
import { listUsersByRole } from "@/lib/users";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const r = normalizeRole(session.user.role);
  if (r !== ROLES.ADMIN && r !== ROLES.MANAGER) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const users = await listUsersByRole(ROLES.TEAM_MEMBER);
    return NextResponse.json({ users });
  } catch (err) {
    console.error("assignable users", err);
    return NextResponse.json({ error: "Could not load users." }, { status: 500 });
  }
}
