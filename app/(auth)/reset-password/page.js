import { Suspense } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = {
  title: "Reset password",
};

function ResetFallback() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-zinc-900/40 p-10 text-center text-sm text-zinc-400 backdrop-blur-xl">
      Loading…
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
