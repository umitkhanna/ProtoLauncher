import { Suspense } from "react";
import { isGoogleAuthConfigured } from "@/lib/google-auth-config";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sign in",
};

function LoginFallback() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-zinc-900/40 p-10 text-center text-sm text-zinc-400 backdrop-blur-xl">
      Loading…
    </div>
  );
}

export default function LoginPage() {
  const googleEnabled = isGoogleAuthConfigured();

  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm googleEnabled={googleEnabled} />
    </Suspense>
  );
}
