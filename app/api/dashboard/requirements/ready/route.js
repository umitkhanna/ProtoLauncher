import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getProjectByIdAndUser,
  userHasGeneratedRequirements,
} from "@/lib/projects";

/**
 * Poll until the worker has written the spec for this user (or optional project).
 */
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid session." }, { status: 400 });
  }

  const projectIdRaw = request.nextUrl.searchParams.get("projectId");
  if (projectIdRaw != null && projectIdRaw !== "") {
    const projectId = Number(projectIdRaw);
    if (!Number.isFinite(projectId)) {
      return NextResponse.json({ error: "Invalid projectId." }, { status: 400 });
    }
    const project = await getProjectByIdAndUser(projectId, userId);
    if (!project) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    const complete = Boolean(
      project.requirements_document &&
        String(project.requirements_document).trim(),
    );
    return NextResponse.json({ complete });
  }

  const complete = await userHasGeneratedRequirements(userId);
  return NextResponse.json({ complete });
}
