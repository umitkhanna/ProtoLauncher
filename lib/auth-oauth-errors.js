/**
 * @param {string | null | undefined} code
 */
export function googleAuthErrorMessage(code) {
  switch (code) {
    case "OAuthAccountNotLinked":
      return "This email is already registered with a password. Sign in with email and password first; your Google account will link automatically when the email matches.";
    case "AccessDenied":
      return "Google sign-in was cancelled.";
    case "Configuration":
      return "Google sign-in is not configured on this server.";
    case "OAuthSignin":
    case "OAuthCallback":
      return "Google sign-in failed. Please try again.";
    default:
      return code
        ? "Sign-in failed. Please try again or use email and password."
        : null;
  }
}
