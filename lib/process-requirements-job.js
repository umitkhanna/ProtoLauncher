import {
  generateRequirementsSpecRaw,
  normalizeModelOutputToHtml,
} from "./ai-generate-requirements.js";
import { sanitizeRequirementsHtml } from "./sanitize-requirements-html.js";
import {
  getProjectByIdAndUser,
  saveGeneratedRequirements,
} from "./projects.js";

/**
 * Runs the same pipeline your BullMQ worker should run (AI → HTML → sanitize → DB).
 */
export async function processRequirementsGenerationJob({ projectId, userId }) {
  const project = await getProjectByIdAndUser(Number(projectId), Number(userId));
  if (!project) {
    throw new Error("Invalid project or access denied");
  }

  const raw = await generateRequirementsSpecRaw(project);
  const htmlDirty = normalizeModelOutputToHtml(raw);
  const requirementsDocument = sanitizeRequirementsHtml(htmlDirty);

  await saveGeneratedRequirements(Number(projectId), requirementsDocument);
}
