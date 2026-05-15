/**
 * Blocks text that describes clearly illegal or severely harmful activity
 * (sexual exploitation of minors, violence-for-hire, trafficking, blatant fraud
 * tooling, etc.). Used for project intake and backlog issue fields.
 */

export const INTAKE_POLICY_ERROR =
  "This submission is not allowed. Remove references to illegal or severely harmful activity and try again.";

export const INTAKE_POLICY_CODE = "INTAKE_POLICY";

/**
 * Lowercase, strip invisibles, map punctuation to spaces for reliable matching.
 * @param {string} raw
 */
export function normalizePolicyInput(raw) {
  let s = String(raw || "")
    .normalize("NFKC")
    .toLowerCase();
  s = s.replace(/[\u200b-\u200d\ufeff\u2060-\u206f]/g, "");
  s = s.replace(/[\u0000-\u001f\u007f]/g, " ");
  s = s.replace(/[^a-z0-9]+/g, " ");
  return s.replace(/\s+/g, " ").trim();
}

/**
 * After {@link normalizePolicyInput}; use word boundaries on ASCII tokens.
 */
const POLICY_PATTERNS = [
  /\bchild\b.*\bporn/,
  /\bchild\b.*\bsexual\b.*\b(abuse|exploit|material)\b/,
  /\bpreteen\b.*\b(porn|sex|nude)\b/,
  /\bunderage\b.*\b(porn|sex|nude)\b/,
  /\bjailbait\b/,
  /\bcsam\b/,

  /\b(hit\s*man|hitman)\b/,
  /\bcontract\b.*\bkill(ing)?\b/,
  /\bmurder\b.*\bfor\b.*\bhire\b/,
  /\bassassin\b.*\b(for\s*hire|service)\b/,

  /\bhuman\b.*\btraffick/,
  /\bsex\b.*\btraffick/,

  /\bhow\b.*\bto\b.*\b(make|build)\b.*\b(bomb|ied|explosive)\b/,
  /\bterror(ist)?\b.*\b(attack|bomb)\b.*\b(plan|manual)\b/,

  /\b(credit\s*card|ssn|social\s*security)\b.*\b(dump|skim|steal)\b/,
  /\bsteal\b.*\b(credit\s*cards?|identities)\b/,
  /\bphishing\b.*\b(kit|campaign)\b.*\b(bank|password)\b/,
];

function normalizedTextViolatesPolicy(normalized) {
  if (!normalized) return false;
  return POLICY_PATTERNS.some((re) => re.test(normalized));
}

function joinedPartsViolatePolicy(parts) {
  const text = normalizePolicyInput(parts.join("\n"));
  return normalizedTextViolatesPolicy(text);
}

/** @returns {{ ok: true } | { ok: false, code: string }} */
export function validateProjectIntakePolicy(parts) {
  if (
    joinedPartsViolatePolicy([
      parts.name,
      parts.startupIdea,
      parts.targetAudience,
      parts.businessGoals,
      parts.intakeNotes ?? "",
    ])
  ) {
    return { ok: false, code: INTAKE_POLICY_CODE };
  }
  return { ok: true };
}

/**
 * Validates only fields present on `parts` (use for PATCH). For create, pass all text fields.
 * @param {Record<string, unknown>} parts
 * @returns {{ ok: true } | { ok: false, code: string }}
 */
export function validateIssueContentPolicy(parts) {
  const chunks = [];
  for (const key of ["summary", "description", "acceptance_criteria", "labels"]) {
    if (
      Object.prototype.hasOwnProperty.call(parts, key) &&
      parts[key] != null
    ) {
      chunks.push(String(parts[key]));
    }
  }
  if (!chunks.length) return { ok: true };
  if (joinedPartsViolatePolicy(chunks)) {
    return { ok: false, code: INTAKE_POLICY_CODE };
  }
  return { ok: true };
}
