"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AuthCard,
  AuthField,
  AuthSubmitButton,
} from "../AuthFormPrimitives";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [debugLink, setDebugLink] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setDebugLink("");
    setPending(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Request failed.");
        setPending(false);
        return;
      }
      setMessage(data.message || "Check your inbox for next steps.");
      if (data.debugResetUrl) setDebugLink(data.debugResetUrl);
    } catch {
      setError("Something went wrong. Try again.");
    }
    setPending(false);
  }

  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter the email you used to register. If it matches an account, you will receive reset instructions."
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <AuthField
          label="Email"
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error ? (
          <p className="text-center text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-center text-sm text-zinc-300" role="status">
            {message}
          </p>
        ) : null}
        {debugLink ? (
          <p className="break-all rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-left text-xs text-amber-100">
            Debug mode: open this link to reset (do not use in production with{" "}
            <code className="text-amber-50">AUTH_DEBUG_RESET_LINK</code> enabled
            publicly).
            <br />
            <a href={debugLink} className="mt-2 inline-block font-medium underline">
              {debugLink}
            </a>
          </p>
        ) : null}
        <AuthSubmitButton pending={pending}>Send reset link</AuthSubmitButton>
      </form>

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
