/**
 * Copy DATABASE_*, REDIS_*, and AI_* vars from the repo root .env.local (or .env)
 * into queue-api/.env. Preserves any other keys already in queue-api/.env.
 *
 * Usage: node scripts/sync-queue-api-env.mjs
 *        npm run worker:env
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const queueEnvPath = path.join(root, "queue-api", ".env");

const SOURCE_KEYS = [
  "DATABASE_HOST",
  "DATABASE_USER",
  "DATABASE_PASSWORD",
  "DATABASE_NAME",
  "DATABASE_SSL",
  "DATABASE_POOL_LIMIT",
  "DATABASE_POOL_MAX_IDLE",
  "REDIS_HOST",
  "REDIS_PORT",
  "REDIS_PASSWORD",
  "REDIS_URL",
  "AI_PROVIDER",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_MODEL",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function formatEnvLine(key, value) {
  const v = value == null ? "" : String(value);
  if (v === "") return `${key}=`;
  if (/[\r\n#]/.test(v) || /^\s/.test(v) || /\s$/.test(v)) {
    return `${key}="${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return `${key}=${v}`;
}

function findRootEnvPath() {
  const local = path.join(root, ".env.local");
  const plain = path.join(root, ".env");
  if (fs.existsSync(local)) return local;
  if (fs.existsSync(plain)) return plain;
  return null;
}

async function main() {
  const srcPath = findRootEnvPath();
  if (!srcPath) {
    throw new Error(
      `No root .env.local or .env found under ${root}. Create one with DATABASE_* (and REDIS_* if needed).`,
    );
  }

  const fromRoot = parseEnvFile(srcPath);
  const merged = parseEnvFile(queueEnvPath);

  let copied = 0;
  for (const key of SOURCE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(fromRoot, key)) {
      merged[key] = fromRoot[key];
      copied += 1;
    }
  }

  const retiredAnthropic = new Set([
    "claude-3-5-sonnet-20241022",
    "claude-3-5-sonnet-20240620",
    "claude-3-7-sonnet-20250219",
  ]);
  const m = merged.ANTHROPIC_MODEL?.trim();
  if (m && retiredAnthropic.has(m)) {
    console.warn(
      `[worker:env] Replacing retired ANTHROPIC_MODEL "${m}" with claude-sonnet-4-6`,
    );
    merged.ANTHROPIC_MODEL = "claude-sonnet-4-6";
  }

  if (!merged.DATABASE_HOST || !merged.DATABASE_USER || !merged.DATABASE_NAME) {
    console.warn(
      "Warning: after sync, DATABASE_HOST, DATABASE_USER, or DATABASE_NAME may still be empty. Check your root env file.",
    );
  }

  const header = [
    "# Generated / updated by: npm run worker:env",
    `# Source: ${path.relative(root, srcPath)}`,
    "# Re-run: npm run worker:env  —  copies from root .env.local or .env",
    "",
    "# --- MySQL (synced from main project) ---",
  ];

  const lines = [...header];
  for (const key of [
    "DATABASE_HOST",
    "DATABASE_USER",
    "DATABASE_PASSWORD",
    "DATABASE_NAME",
    "DATABASE_SSL",
    "DATABASE_POOL_LIMIT",
    "DATABASE_POOL_MAX_IDLE",
  ]) {
    if (Object.prototype.hasOwnProperty.call(merged, key)) {
      lines.push(formatEnvLine(key, merged[key]));
    }
  }

  lines.push("", "# --- Redis (synced from main project) ---");
  for (const key of ["REDIS_HOST", "REDIS_PORT", "REDIS_PASSWORD", "REDIS_URL"]) {
    if (Object.prototype.hasOwnProperty.call(merged, key)) {
      lines.push(formatEnvLine(key, merged[key]));
    }
  }

  lines.push("", "# --- AI (synced from main project when set) ---");
  for (const key of [
    "AI_PROVIDER",
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_MODEL",
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
  ]) {
    if (Object.prototype.hasOwnProperty.call(merged, key)) {
      lines.push(formatEnvLine(key, merged[key]));
    }
  }

  const restKeys = Object.keys(merged)
    .filter((k) => !SOURCE_KEYS.includes(k))
    .sort();

  if (restKeys.length) {
    lines.push("", "# --- Other (preserved) ---");
    for (const key of restKeys) {
      lines.push(formatEnvLine(key, merged[key]));
    }
  } else if (
    !Object.prototype.hasOwnProperty.call(merged, "ANTHROPIC_API_KEY") &&
    !Object.prototype.hasOwnProperty.call(merged, "OPENAI_API_KEY")
  ) {
    lines.push(
      "",
      "# Add at least one API key above (copied from root) or here:",
      "# ANTHROPIC_API_KEY=",
    );
  }

  fs.mkdirSync(path.dirname(queueEnvPath), { recursive: true });
  fs.writeFileSync(queueEnvPath, `${lines.join("\n")}\n`, "utf8");

  console.log(`Wrote ${path.relative(root, queueEnvPath)} (${copied} values copied from ${path.basename(srcPath)}).`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
