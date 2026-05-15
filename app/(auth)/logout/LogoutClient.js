"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { AuthCard } from "../AuthFormPrimitives";

export function LogoutClient() {
  const [state, setState] = useState("signing-out");

  useEffect(() => {
    signOut({ callbackUrl: "/" }).catch(() => setState("error"));
  }, []);

  return (
    <AuthCard
      title="Signing out"
      subtitle={
        state === "error"
          ? "We could not complete sign-out in this tab. You can try again or clear site data for this origin."
          : "You will be redirected to the home page."
      }
    >
      {state === "error" ? (
        <p className="text-center">
          <button
            type="button"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950"
            onClick={() => {
              setState("signing-out");
              signOut({ callbackUrl: "/" }).catch(() => setState("error"));
            }}
          >
            Try again
          </button>
        </p>
      ) : null}
      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link href="/" className="text-zinc-200 underline-offset-4 hover:underline">
          Home
        </Link>
      </p>
    </AuthCard>
  );
}
