import { redirect } from "next/navigation";

export default function RequirementsIndexRedirect() {
  redirect("/dashboard/requirements/edit");
}
