"use client";

import Link from "next/link";
import { ProductDiscoveryForm } from "../ProductDiscoveryForm";

export function OnboardingForm() {
  return (
    <>
      <ProductDiscoveryForm variant="standalone" additionalProject={false} />
      <p className="mx-auto max-w-lg px-6 pb-10 text-center text-xs text-zinc-600 sm:px-8">
        Need to leave? You can{" "}
        <Link href="/logout" className="text-zinc-400 underline hover:text-zinc-300">
          sign out
        </Link>{" "}
        and return later—your account stays safe.
      </p>
    </>
  );
}
