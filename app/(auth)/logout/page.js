import { LogoutClient } from "./LogoutClient";

export const metadata = {
  title: "Sign out",
  robots: { index: false, follow: false },
};

export default function LogoutPage() {
  return <LogoutClient />;
}
