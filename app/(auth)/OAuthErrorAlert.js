import { googleAuthErrorMessage } from "@/lib/auth-oauth-errors";

export function OAuthErrorAlert({ errorCode }) {
  const message = googleAuthErrorMessage(errorCode);
  if (!message) return null;

  return (
    <p
      className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-center text-sm text-red-200"
      role="alert"
    >
      {message}
    </p>
  );
}
