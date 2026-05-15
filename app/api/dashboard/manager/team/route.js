import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { normalizeRole, ROLES } from "@/lib/roles";
import { addTeamMemberUnderManager, listTeamMembersForManager } from "@/lib/team-messages";
import { getUserById } from "@/lib/users";

function requireManagerOrAdmin(session) {
  const r = normalizeRole(session?.user?.role);
  if (r !== ROLES.ADMIN && r !== ROLES.MANAGER) {
    return NextResponse.json({ error: "Managers or admins only." }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const denied = requireManagerOrAdmin(session);
  if (denied) return denied;

  const managerId = Number(session.user.id);
  try {
    const members = await listTeamMembersForManager(managerId);
    return NextResponse.json({ members });
  } catch (err) {
    console.error("manager team list", err);
    const msg = String(err?.message || err);
    if (msg.includes("Unknown column") || msg.includes("doesn't exist")) {
      return NextResponse.json(
        { error: "Run database migration: npm run db:rbac" },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Could not load team." }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const denied = requireManagerOrAdmin(session);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const memberUserId = Number(body?.memberUserId);
  if (!Number.isFinite(memberUserId)) {
    return NextResponse.json({ error: "memberUserId is required." }, { status: 400 });
  }

  const member = await getUserById(memberUserId);
  if (!member) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (normalizeRole(member.role) !== ROLES.TEAM_MEMBER) {
    return NextResponse.json(
      { error: "Only internal team_member accounts can be added to a manager roster." },
      { status: 400 },
    );
  }

  const managerId = Number(session.user.id);
  try {
    await addTeamMemberUnderManager(managerId, memberUserId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("manager team add", err);
    return NextResponse.json(
      { error: String(err?.message || err) || "Could not add member." },
      { status: 500 },
    );
  }
}
