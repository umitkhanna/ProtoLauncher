"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AuthCard,
  AuthField,
  AuthSubmitButton,
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
      title="Set a new password"
      subtitle="Choose a strong password you have not used elsewhere."
    >
      {missingParams ? (
        <p className="text-center text-sm text-zinc-400">
          This page needs a valid reset link. Request a new one from{" "}
          <Link href="/forgot-password" className="text-violet-400 hover:underline">
            forgot password
          </Link>
          .
        </p>
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
          {error ? (
            <p className="text-center text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <AuthSubmitButton pending={pending}>Update password</AuthSubmitButton>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link
          href="/login"
          className="font-medium text-zinc-200 underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
