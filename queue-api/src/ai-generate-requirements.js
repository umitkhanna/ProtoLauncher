import { marked } from "marked";
import {
  buildProductDiscoveryUserPrompt,
  REQUIREMENTS_SPEC_SYSTEM_PROMPT,
} from "./prompts/requirements-spec-prompt.js";

function resolveProvider() {
  const explicit = (process.env.AI_PROVIDER || "").toLowerCase();
  if (explicit === "anthropic" || explicit === "claude") return "anthropic";
  if (explicit === "openai") return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

const MAX_OUT_TOKENS = Number(
  process.env.REQUIREMENTS_MAX_OUTPUT_TOKENS || 16_000,
);

async function generateWithOpenAI(userPrompt) {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await client.chat.completions.create({
    model,
    temperature: 0.35,
    max_tokens: Math.min(MAX_OUT_TOKENS, 16_384),
    messages: [
      { role: "system", content: REQUIREMENTS_SPEC_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });
  const text = res.choices[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned empty content.");
  return text;
}

async function generateWithAnthropic(userPrompt) {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model =
    process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  try {
    const msg = await client.messages.create({
      model,
      max_tokens: Math.min(MAX_OUT_TOKENS, 16_384),
      system: REQUIREMENTS_SPEC_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
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
        `Anthropic rejected model "${model}". Set ANTHROPIC_MODEL to an active model (e.g. claude-sonnet-4-6). ${m}`,
      );
    }
    throw err;
  }
}

export function normalizeModelOutputToHtml(raw) {
  const text = String(raw || "").trim();
  if (!text) return "<p>No content generated.</p>";

  const fenceHtml = text.match(/```html\s*([\s\S]*?)```/i);
  if (fenceHtml) return fenceHtml[1].trim();

  const fenceMd = text.match(/```(?:markdown|md)?\s*([\s\S]*?)```/i);
  if (fenceMd) {
    return String(marked.parse(fenceMd[1].trim(), { async: false }));
  }

  if (/^\s*</.test(text)) {
    return text;
  }

  return String(marked.parse(text, { async: false }));
}

/**
 * @param {object} projectRow from getProjectByIdAndUser
 */
export async function generateRequirementsSpecRaw(projectRow) {
  const provider = resolveProvider();
  if (!provider) {
    throw new Error(
      "No AI provider configured. Set ANTHROPIC_API_KEY and/or OPENAI_API_KEY in queue-api/.env",
    );
  }

  const userPrompt = buildProductDiscoveryUserPrompt(projectRow);

  if (provider === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is missing in queue-api/.env");
    }
    return generateWithAnthropic(userPrompt);
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing in queue-api/.env");
  }
  return generateWithOpenAI(userPrompt);
}
