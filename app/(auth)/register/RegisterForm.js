"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Sparkles } from "lucide-react";
import { AuthDivider } from "../AuthDivider";
import { GoogleSignInButton } from "../GoogleSignInButton";
import {
  AuthAlert,
  AuthCard,
  AuthField,
  AuthSubmitButton,
  AuthTextLink,
} from "../AuthFormPrimitives";

export function RegisterForm({ googleEnabled = false }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not register.");
        setPending(false);
        return;
      }

      const sign = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (sign?.error) {
        router.push("/login?registered=1");
        return;
      }
      router.push("/dashboard");
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
          Get started
        </>
      }
      title="Create account"
      subtitle="Fastest path: Google. Or register with email and a strong password."
      footer={
        <p className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <AuthTextLink href="/login">Sign in</AuthTextLink>
        </p>
      }
    >
      {googleEnabled ? (
        <>
          <GoogleSignInButton callbackUrl="/dashboard" label="Sign up with Google" />
          <AuthDivider label="or register with email" />
        </>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5">
        <AuthField
          label="Name (optional)"
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <AuthField
          label="Email"
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthField
          label="Password"
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-left text-xs text-zinc-500">
          Use at least 8 characters with a letter and a number.
        </p>
        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
        <AuthSubmitButton pending={pending}>Create account with email</AuthSubmitButton>
      </form>
    </AuthCard>
  );
}
