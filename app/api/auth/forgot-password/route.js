import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/users";
import {
  deleteResetTokensForUser,
  insertResetToken,
} from "@/lib/password-reset";
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/token";
import { isValidEmail } from "@/lib/validation";

function buildResetUrl(token, email) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const params = new URLSearchParams({ token, email: email.toLowerCase() });
  return `${base}/reset-password?${params.toString()}`;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body?.email;
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const normalized = String(email).toLowerCase().trim();
  let debugResetUrl;

  try {
    const user = await getUserByEmail(normalized);
    if (user?.password_hash) {
      const plain = generateOpaqueToken();
      const tokenHash = hashOpaqueToken(plain);
      await deleteResetTokensForUser(user.id);
      await insertResetToken(user.id, tokenHash);

      const resetUrl = buildResetUrl(plain, user.email);

      if (process.env.AUTH_DEBUG_RESET_LINK === "true") {
        console.info("[forgot-password] reset link (debug):", resetUrl);
        debugResetUrl = resetUrl;
      }

      // Wire SMTP or Resend here in production.
    }
  } catch (err) {
    console.error("forgot-password error", err);
  }

  const payload = {
    ok: true,
    message:
      "If an account exists for that email, password reset instructions have been sent.",
    ...(debugResetUrl ? { debugResetUrl } : {}),
  };

  return NextResponse.json(payload);
}
