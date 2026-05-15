/** @typedef {'admin'|'manager'|'team_member'|'client'|'client_team_member'} PlatformRole */

export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  TEAM_MEMBER: "team_member",
  CLIENT: "client",
  CLIENT_TEAM_MEMBER: "client_team_member",
};

const ALL = new Set(Object.values(ROLES));

/**
 * @param {string | undefined | null} role
 * @returns {PlatformRole}
 */
export function normalizeRole(role) {
  const r = String(role || ROLES.CLIENT).toLowerCase().trim();
  return ALL.has(r) ? /** @type {PlatformRole} */ (r) : ROLES.CLIENT;
}

/**
 * @param {string | undefined | null} role
 */
export function isStaffRole(role) {
  const r = normalizeRole(role);
  return r === ROLES.ADMIN || r === ROLES.MANAGER || r === ROLES.TEAM_MEMBER;
}

/**
 * @param {{ role?: string | null }} user
 */
export function canAccessOnboardingFlow(user) {
  return normalizeRole(user?.role) === ROLES.CLIENT;
}

/**
 * @param {{ role?: string | null }} user
 */
export function canCreateProjects(user) {
  const r = normalizeRole(user?.role);
  return r === ROLES.CLIENT || r === ROLES.ADMIN;
}

/**
 * @param {{ role?: string | null }} user
 */
export function canRunRequirementsGeneration(user) {
  const r = normalizeRole(user?.role);
  return r === ROLES.CLIENT || r === ROLES.ADMIN;
}
