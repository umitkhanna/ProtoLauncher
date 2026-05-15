import { loadAiEnvFromQueueApiIfNeeded } from "./load-ai-env-from-queue-api.js";
import {
  buildHomePreviewClassifyUserPrompt,
  buildHomePreviewGenerateUserPrompt,
  HOME_PREVIEW_CLASSIFY_SYSTEM,
  HOME_PREVIEW_GENERATE_SYSTEM,
} from "./prompts/home-preview-prompt.js";

/**
 * @param {string} text
 * @returns {{ eligible: boolean, surface: string, reason: string }}
 */
export function parseClassificationJson(text) {
  const t = String(text || "").trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  const raw = fence ? fence[1].trim() : t;
  try {
    const o = JSON.parse(raw);
    const surface = String(o.surface || "none").toLowerCase();
    return {
      eligible: Boolean(o.eligible),
      surface: ["web", "mobile", "multi", "none"].includes(surface) ? surface : "none",
      reason: String(o.reason || "").trim().slice(0, 400),
    };
  } catch {
    return { eligible: false, surface: "none", reason: "invalid_classification_json" };
  }
}

/**
 * @param {string} text
 * @returns {string}
 */
export function extractHtmlDocument(text) {
  const t = String(text || "").trim();
  const fence = /```(?:html)?\s*([\s\S]*?)```/im.exec(t);
  const inner = fence ? fence[1].trim() : t;
  const lower = inner.toLowerCase();
  const i = lower.indexOf("<!doctype html");
  const j = lower.indexOf("<html");
  const start = i >= 0 ? i : j >= 0 ? j : 0;
  return inner.slice(start).trim() || inner;
}

async function callAnthropic(system, user, maxTokens) {
  loadAiEnvFromQueueApiIfNeeded();
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is missing. Home preview generation uses Claude only; add the key to .env.local or queue-api/.env.",
    );
  }
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  try {
    const msg = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = msg.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      throw new Error("Anthropic returned no text block.");
    }
    return block.text;
  } catch (err) {
    const m = String(err?.message ?? err);
    if (m.includes("not_found_error") || /model:.*not found/i.test(m)) {
      throw new Error(
        `Anthropic rejected model "${model}". Set ANTHROPIC_MODEL to an active model. ${m}`,
      );
    }
    throw err;
  }
}

/**
 * @param {{ projectName: string, requirementsPlainText: string }} input
 */
export async function classifyHomePreviewSurface(input) {
  const user = buildHomePreviewClassifyUserPrompt(
    input.projectName,
    input.requirementsPlainText,
  );
  const text = await callAnthropic(HOME_PREVIEW_CLASSIFY_SYSTEM, user, 600);
  return parseClassificationJson(text);
}

/**
 * @param {{ projectName: string, requirementsPlainText: string, surface: string }} input
 * @returns {Promise<string>} raw HTML string from the model
 */
export async function generateHomePreviewHtmlRaw(input) {
  const user = buildHomePreviewGenerateUserPrompt(
    input.projectName,
    input.requirementsPlainText,
    input.surface,
  );
  return callAnthropic(HOME_PREVIEW_GENERATE_SYSTEM, user, 12_000);
}
