import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { normalizeRole, ROLES } from "@/lib/roles";
import { adminUpdateUserRole } from "@/lib/users";

function requireAdmin(session) {
  if (normalizeRole(session?.user?.role) !== ROLES.ADMIN) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  return null;
}

export async function PATCH(request, props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const denied = requireAdmin(session);
  if (denied) return denied;

  const params = await props.params;
  const userId = Number(params.userId);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const role = normalizeRole(body?.role);
  const parentRaw = body?.parentClientId;
  const parentClientId =
    parentRaw === undefined
      ? undefined
      : parentRaw === null || String(parentRaw).trim() === ""
        ? null
        : Number(parentRaw);

  if (role === ROLES.CLIENT_TEAM_MEMBER && parentClientId == null) {
    return NextResponse.json(
      { error: "parentClientId is required for client team members." },
      { status: 400 },
    );
  }

  try {
    await adminUpdateUserRole(userId, {
      role,
      parentClientId:
        parentClientId === undefined ? undefined : parentClientId,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin patch user", err);
    return NextResponse.json(
      { error: String(err?.message || err) || "Update failed." },
      { status: 500 },
    );
  }
}
