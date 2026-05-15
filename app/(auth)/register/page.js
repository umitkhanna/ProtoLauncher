import { isGoogleAuthConfigured } from "@/lib/google-auth-config";
import { RegisterForm } from "./RegisterForm";

export const metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  const googleEnabled = isGoogleAuthConfigured();

  return <RegisterForm googleEnabled={googleEnabled} />;
}
