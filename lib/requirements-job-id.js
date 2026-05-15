export function requirementsJobIdForProject(projectId) {
  return `requirements-${Number(projectId)}`;
}

export function parseProjectIdFromRequirementsJobId(jobId) {
  const m = /^requirements-(\d+)$/.exec(String(jobId || ""));
  return m ? Number(m[1]) : null;
}
