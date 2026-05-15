"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");

  function onSubmit(e) {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setStatus("error");
      return;
    }
    // Wire to your transactional / ESP endpoint in production.
    setStatus("success");
    setEmail("");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
      aria-label="Subscribe to ProtoLauncher updates"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <div className="flex-1">
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          placeholder="you@startup.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          className="w-full rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          required
          aria-invalid={status === "error"}
          aria-describedby="newsletter-status"
        />
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
      >
        {status === "success" ? (
          <>
            Subscribed <Check className="h-4 w-4" aria-hidden />
          </>
        ) : (
          <>
            Subscribe <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>
      <p
        id="newsletter-status"
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {status === "success"
          ? "Thanks. You're on the list."
          : status === "error"
            ? "Please enter a valid email address."
            : ""}
      </p>
    </form>
  );
}
