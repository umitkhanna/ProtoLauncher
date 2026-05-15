"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Sparkles } from "lucide-react";
import { AuthDivider } from "../AuthDivider";
import { GoogleSignInButton } from "../GoogleSignInButton";
import { OAuthErrorAlert } from "../OAuthErrorAlert";
import {
  AuthAlert,
  AuthCard,
  AuthField,
  AuthSubmitButton,
  AuthTextLink,
} from "../AuthFormPrimitives";

export function LoginForm({ googleEnabled = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallback &&
    typeof rawCallback === "string" &&
    rawCallback.startsWith("/") &&
    !rawCallback.startsWith("//")
      ? rawCallback
      : "/dashboard";
  const registered = searchParams.get("registered");
  const reset = searchParams.get("reset");
  const oauthError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError("Invalid email or password.");
        setPending(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setPending(false);
    }
  }

  return (
    <AuthCard
      badge={
        <>
          <Sparkles className="h-3.5 w-3.5 text-violet-300" aria-hidden />
          Welcome back
        </>
      }
      title="Sign in"
      subtitle="Continue with Google or your email to open your dashboard."
      footer={
        <p className="text-center text-sm text-zinc-500">
          No account?{" "}
          <AuthTextLink href="/register">Create one</AuthTextLink>
        </p>
      }
    >
      {googleEnabled ? (
        <>
          <GoogleSignInButton callbackUrl={callbackUrl} />
          <AuthDivider label="or continue with email" />
        </>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5">
        {registered ? (
          <AuthAlert variant="success">
            Account created. Sign in with your new password or Google.
          </AuthAlert>
        ) : null}
        {reset ? (
          <AuthAlert variant="success">
            Password updated. Sign in with your new password.
          </AuthAlert>
        ) : null}
        <OAuthErrorAlert errorCode={oauthError} />
        <AuthField
          label="Email"
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <AuthField
            label="Password"
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-2 text-right">
            <AuthTextLink href="/forgot-password">Forgot password?</AuthTextLink>
          </p>
        </div>
        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
        <AuthSubmitButton pending={pending}>Sign in with email</AuthSubmitButton>
      </form>
    </AuthCard>
  );
}
