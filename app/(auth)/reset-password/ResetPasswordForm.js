"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import {
  AuthAlert,
  AuthCard,
  AuthField,
  AuthSubmitButton,
  AuthTextLink,
} from "../AuthFormPrimitives";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const t = searchParams.get("token") || "";
    const e = searchParams.get("email") || "";
    setToken(t);
    setEmail(e);
  }, [searchParams]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email: email.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not reset password.");
        setPending(false);
        return;
      }
      router.push("/login?reset=1");
    } catch {
      setError("Something went wrong. Try again.");
      setPending(false);
    }
  }

  const missingParams = !token || !email;

  return (
    <AuthCard
      badge={
        <>
          <LockKeyhole className="h-3.5 w-3.5 text-violet-300" aria-hidden />
          New password
        </>
      }
      title="Set a new password"
      subtitle="Choose a strong password you have not used elsewhere."
      footer={
        <p className="text-center text-sm text-zinc-500">
          <AuthTextLink href="/login">Back to sign in</AuthTextLink>
        </p>
      }
    >
      {missingParams ? (
        <AuthAlert variant="info">
          This page needs a valid reset link. Request a new one from{" "}
          <AuthTextLink href="/forgot-password">forgot password</AuthTextLink>.
        </AuthAlert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <AuthField
            label="Email"
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <AuthField
            label="New password"
            id="reset-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-left text-xs text-zinc-500">
            At least 8 characters with a letter and a number.
          </p>
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          <AuthSubmitButton pending={pending}>Update password</AuthSubmitButton>
        </form>
      )}
    </AuthCard>
  );
}
