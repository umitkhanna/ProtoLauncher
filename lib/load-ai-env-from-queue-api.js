import fs from "fs";
import path from "path";

let attemptedLoad = false;

function isAiEnvKey(key) {
  return (
    key === "AI_PROVIDER" ||
    key.startsWith("ANTHROPIC_") ||
    key.startsWith("OPENAI_")
  );
}

function parseEnvLines(raw) {
  const out = {};
  for (const line of raw.split("\n")) {
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

/**
 * Next.js loads `.env.local` only. The BullMQ worker often has keys in `queue-api/.env` only.
 * Merge AI-related vars from `queue-api/.env` when the process has no API keys yet.
 */
export function loadAiEnvFromQueueApiIfNeeded() {
  if (attemptedLoad) return;
  attemptedLoad = true;

  const hasKey =
    Boolean(process.env.ANTHROPIC_API_KEY?.trim()) ||
    Boolean(process.env.OPENAI_API_KEY?.trim());
  if (hasKey) return;

  const envPath = path.join(process.cwd(), "queue-api", ".env");
  if (!fs.existsSync(envPath)) return;

  let parsed;
  try {
    parsed = parseEnvLines(fs.readFileSync(envPath, "utf8"));
  } catch {
    return;
  }

  for (const [key, val] of Object.entries(parsed)) {
    if (!isAiEnvKey(key)) continue;
    const current = process.env[key];
    if (current != null && String(current).trim() !== "") continue;
    if (val != null && String(val).trim() !== "") {
      process.env[key] = String(val);
    }
  }
}
