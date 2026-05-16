/**
 * @param {string | null | undefined} code
 */
export function googleAuthErrorMessage(code) {
  switch (code) {
    case "OAuthAccountNotLinked":
      return "This email is already registered with a password. Sign in with email and password first; your Google account will link automatically when the email matches.";
    case "MissingEmail":
      return "Google did not return an email for this account. Ensure the Google OAuth client requests the email scope, or try another Google account.";
    case "MissingGoogleSub":
      return "Google sign-in returned an incomplete profile. Please try again.";
    case "AccountCreateFailed":
    case "SignInFailed":
      return "We could not finish signing you in. Try again in a moment, or use email and password. If it keeps happening, check server logs for database errors.";
    case "AccessDenied":
      return "Google sign-in was blocked or cancelled. If you did not cancel, the server may have refused the login—try email/password or contact support.";
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
