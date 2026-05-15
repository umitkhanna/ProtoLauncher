import {
  generateRequirementsSpecRaw,
  normalizeModelOutputToHtml,
} from "./ai-generate-requirements.js";
import { sanitizeRequirementsHtml } from "./sanitize-requirements-html.js";
import {
  getProjectByIdAndUser,
  saveGeneratedRequirements,
} from "./projects.js";

export async function processRequirementsGenerationJob({ projectId, userId }) {
  const project = await getProjectByIdAndUser(Number(projectId), Number(userId));
  if (!project) {
    throw new Error("Invalid project or access denied");
  }

  console.log(`[queue-api] AI generate for project ${projectId} (${project.name})`);
  const raw = await generateRequirementsSpecRaw(project);
  const htmlDirty = normalizeModelOutputToHtml(raw);
  const requirementsDocument = sanitizeRequirementsHtml(htmlDirty);

  await saveGeneratedRequirements(Number(projectId), requirementsDocument);
  console.log(
    `[queue-api] saved requirements_document (${requirementsDocument.length} chars) project ${projectId}`,
  );
}
