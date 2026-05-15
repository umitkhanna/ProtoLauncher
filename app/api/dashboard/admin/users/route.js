import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { normalizeRole, ROLES } from "@/lib/roles";
import { createUser, getUserByEmail, listUsersForAdmin } from "@/lib/users";

function requireAdmin(session) {
  if (normalizeRole(session?.user?.role) !== ROLES.ADMIN) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const denied = requireAdmin(session);
  if (denied) return denied;

  try {
    const users = await listUsersForAdmin();
    return NextResponse.json({ users });
  } catch (err) {
    console.error("admin users list", err);
    const msg = String(err?.message || err);
    if (msg.includes("Unknown column") || msg.includes("doesn't exist")) {
      return NextResponse.json(
        { error: "Run database migration: npm run db:rbac" },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Could not load users." }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const denied = requireAdmin(session);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = String(body?.email ?? "").toLowerCase().trim();
  const password = body?.password;
  const name = body?.name != null ? String(body.name).trim().slice(0, 255) : null;
  const role = normalizeRole(body?.role);
  const parentRaw = body?.parentClientId;
  const parentClientId =
    parentRaw != null && String(parentRaw).trim() !== "" ? Number(parentRaw) : null;

  if (!email || !password || String(password).length < 8) {
    return NextResponse.json(
      { error: "Valid email and password (8+ chars) are required." },
      { status: 400 },
    );
  }

  if (role === ROLES.CLIENT_TEAM_MEMBER && !Number.isFinite(parentClientId)) {
    return NextResponse.json(
      { error: "parentClientId is required for client team members." },
      { status: 400 },
    );
  }

  try {
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(String(password), 12);
    const id = await createUser({
      email,
      passwordHash,
      name,
      role,
      parentClientId: Number.isFinite(parentClientId) ? parentClientId : null,
    });
    return NextResponse.json({ ok: true, userId: id });
  } catch (err) {
    console.error("admin create user", err);
    return NextResponse.json(
      { error: String(err?.message || err) || "Could not create user." },
      { status: 500 },
    );
  }
}
