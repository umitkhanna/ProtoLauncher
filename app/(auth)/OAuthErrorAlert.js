import { googleAuthErrorMessage } from "@/lib/auth-oauth-errors";

export function OAuthErrorAlert({ errorCode }) {
  const message = googleAuthErrorMessage(errorCode);
  if (!message) return null;

  return (
    <p
      className="rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-center text-sm leading-relaxed text-red-100"
      role="alert"
    >
      {message}
    </p>
  );
}
