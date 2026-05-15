import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { getPool } from "@/lib/db";
import { normalizeRole, ROLES } from "@/lib/roles";
import { createUser, getUserByEmail } from "@/lib/users";

function requireClient(session) {
  if (normalizeRole(session?.user?.role) !== ROLES.CLIENT) {
    return NextResponse.json({ error: "Customer accounts only." }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const denied = requireClient(session);
  if (denied) return denied;

  const ownerId = Number(session.user.id);
  try {
    const [rows] = await getPool().query(
      `SELECT id, email, name, role, created_at
       FROM users
       WHERE parent_client_id = ? AND role = 'client_team_member'
       ORDER BY id DESC`,
      [ownerId],
    );
    return NextResponse.json({ members: rows });
  } catch (err) {
    console.error("client team list", err);
    return NextResponse.json({ error: "Could not load team." }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const denied = requireClient(session);
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

  if (!email || !password || String(password).length < 8) {
    return NextResponse.json(
      { error: "Valid email and password (8+ chars) are required." },
      { status: 400 },
    );
  }

  const ownerId = Number(session.user.id);
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
      role: ROLES.CLIENT_TEAM_MEMBER,
      parentClientId: ownerId,
    });
    return NextResponse.json({ ok: true, userId: id });
  } catch (err) {
    console.error("client team create", err);
    return NextResponse.json(
      { error: String(err?.message || err) || "Could not create team member." },
      { status: 500 },
    );
  }
}
