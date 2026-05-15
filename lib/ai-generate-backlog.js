import {
  buildJiraBacklogUserPrompt,
  JIRA_BACKLOG_SYSTEM_PROMPT,
} from "./prompts/jira-backlog-prompt.js";
import { loadAiEnvFromQueueApiIfNeeded } from "./load-ai-env-from-queue-api.js";

function resolveProvider() {
  const explicit = (process.env.AI_PROVIDER || "").toLowerCase();
  if (explicit === "anthropic" || explicit === "claude") return "anthropic";
  if (explicit === "openai") return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

async function generateWithOpenAI(userPrompt) {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await client.chat.completions.create({
    model,
    temperature: 0.25,
    max_tokens: 8000,
    messages: [
      { role: "system", content: JIRA_BACKLOG_SYSTEM_PROMPT },
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
      max_tokens: 8000,
      system: JIRA_BACKLOG_SYSTEM_PROMPT,
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

/**
 * @param {{ projectName: string, requirementsPlainText: string }} input
 * @returns {Promise<string>} raw model output (JSON or fenced JSON)
 */
export async function generateJiraBacklogJsonRaw(input) {
  loadAiEnvFromQueueApiIfNeeded();
  const provider = resolveProvider();
  if (!provider) {
    throw new Error(
      "No AI provider configured. Add ANTHROPIC_API_KEY and/or OPENAI_API_KEY to .env.local (Next.js server), or put them in queue-api/.env so this app can read the same keys as the worker.",
    );
  }
  const userPrompt = buildJiraBacklogUserPrompt(
    input.projectName,
    input.requirementsPlainText,
  );
  if (provider === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is missing.");
    }
    return generateWithAnthropic(userPrompt);
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }
  return generateWithOpenAI(userPrompt);
}

const PRIORITY_MAP = {
  lowest: "lowest",
  low: "low",
  medium: "medium",
  high: "high",
  highest: "highest",
};

const TYPE_MAP = {
  epic: "epic",
  story: "story",
  task: "task",
  bug: "bug",
  subtask: "subtask",
};

function normPriority(p) {
  const k = String(p || "medium").toLowerCase().trim();
  return PRIORITY_MAP[k] || "medium";
}

function normIssueType(t) {
  const k = String(t || "story")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (k === "subtask") return "subtask";
  return TYPE_MAP[k] || "story";
}

/**
 * @param {string} raw
 * @returns {{ issueType: string, summary: string, description?: string, acceptanceCriteria?: string, storyPoints?: number|null, priority: string }[]}
 */
export function parseBacklogModelOutputToItems(raw) {
  const text = String(raw || "").trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonStr = fence ? fence[1].trim() : text;
  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    throw new Error("Model did not return valid JSON.");
  }
  const items = Array.isArray(data.items) ? data.items : [];
  const out = [];
  for (const row of items) {
    if (!row || typeof row !== "object") continue;
    const summary = String(row.summary || row.title || "").trim().slice(0, 500);
    if (!summary) continue;
    out.push({
      issueType: normIssueType(row.issueType || row.type),
      summary,
      description: row.description
        ? String(row.description).trim().slice(0, 20_000)
        : null,
      acceptanceCriteria: row.acceptanceCriteria
        ? String(row.acceptanceCriteria).trim().slice(0, 20_000)
        : null,
      storyPoints:
        row.storyPoints != null && Number.isFinite(Number(row.storyPoints))
          ? Math.min(100, Math.max(0, Number(row.storyPoints)))
          : null,
      priority: normPriority(row.priority),
    });
  }
  if (!out.length) {
    throw new Error("Model returned no backlog items.");
  }
  return out;
}
