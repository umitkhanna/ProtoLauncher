import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail, updateUserPassword } from "@/lib/users";
import {
  deleteResetTokenByPlain,
  findValidResetContext,
} from "@/lib/password-reset";
import { isValidEmail, validateNewPassword } from "@/lib/validation";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body?.email;
  const token = body?.token;
  const password = body?.password;

  if (!token || typeof token !== "string" || token.length < 32) {
    return NextResponse.json({ error: "Invalid or missing reset token." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const pwdError = validateNewPassword(password);
  if (pwdError) {
    return NextResponse.json({ error: pwdError }, { status: 400 });
  }

  const normalized = String(email).toLowerCase().trim();

  try {
    const ctx = await findValidResetContext(token);
    if (!ctx || ctx.email !== normalized) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 },
      );
    }

    const user = await getUserByEmail(normalized);
    if (!user || Number(user.id) !== Number(ctx.userId)) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    await updateUserPassword(user.id, passwordHash);
    await deleteResetTokenByPlain(token);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("reset-password error", err);
    return NextResponse.json(
      { error: "Could not reset password. Try again later." },
      { status: 500 },
    );
  }
}
