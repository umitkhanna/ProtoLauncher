import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail } from "@/lib/users";
import { isValidEmail, validateNewPassword } from "@/lib/validation";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body?.email;
  const password = body?.password;
  const name = body?.name;

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const pwdError = validateNewPassword(password);
  if (pwdError) {
    return NextResponse.json({ error: pwdError }, { status: 400 });
  }

  if (name != null && typeof name === "string" && name.length > 255) {
    return NextResponse.json({ error: "Name is too long." }, { status: 400 });
  }

  try {
    const existing = await getUserByEmail(String(email));
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    await createUser({
      email: String(email),
      passwordHash,
      name: typeof name === "string" ? name : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("register error", err);
    return NextResponse.json(
      { error: "Could not create account. Check database configuration and schema." },
      { status: 500 },
    );
  }
}
