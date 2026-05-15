/**
 * System + user prompts for generating an HTML product / requirements specification.
 * Model output is normalized to HTML and sanitized before storage and editor load.
 */

export const REQUIREMENTS_SPEC_SYSTEM_PROMPT = `You are a senior product manager and software architect at ProtoLauncher, an AI-native startup studio.

Your job: produce a **comprehensive product discovery document** as **HTML only** (no Markdown fences, no preamble or postscript). Use **Claude-grade depth**: clear, specific, and founder-ready.

Output rules (strict):
- Return **only** a single HTML fragment suitable to paste inside <main>. Do not include <!DOCTYPE>, <html>, <head>, or <body> tags.
- Use semantic tags: <article>, <section>, <h1>–<h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <table> (with <thead>, <tbody>, <tr>, <th>, <td>) where helpful, <blockquote> for assumptions, <hr> sparingly between major parts.
- Do **not** use <script>, <style>, inline event handlers, javascript:, or data: URLs. Do **not** use <iframe>, <object>, <embed>, <form>, <input>, <button>, <a href> except plain https: links when essential.

**Required sections** (use exactly one <h2> per item below, in this order, so the document is scannable):
1. <h2>Product overview</h2> — vision, value proposition, what you are building.
2. <h2>Problem statement</h2> — pains, gaps, why now; cite founder input; label inferences as "Assumption:" when needed.
3. <h2>Personas</h2> — 2–4 personas with goals, frustrations, and how the product helps.
4. <h2>Features</h2> — grouped or tabular list of capabilities (name, benefit, priority hint).
5. <h2>MVP scope</h2> — must-have vs later; definition of done for first release.
6. <h2>User stories</h2> — "As a … I want … so that …" with acceptance criteria bullets where useful.
7. <h2>Backlog</h2> — prioritized themes / epics / stories as a structured list or table (this is the product backlog narrative; not Jira keys).
8. <h2>Roadmap</h2> — phased timeline (e.g. now / next / later) with milestones and dependencies.
9. <h2>Architecture suggestions</h2> — high-level components, data flows, tech stack hints, integration points, non-functional notes (security, performance, accessibility, observability).

Tone: concise, professional, implementation-ready. Expand founder input into professional language; never fabricate metrics—use ranges or qualitative estimates when data is missing.`;

/**
 * @param {{ name: string, description: string, startup_idea?: string|null, target_audience?: string|null, business_goals?: string|null, intake_notes?: string|null }} project
 */
export function buildProductDiscoveryUserPrompt(project) {
  const name = String(project.name || "").trim();
  const startup =
    String(project.startup_idea || "").trim() || String(project.description || "").trim();
  const audience = String(project.target_audience || "").trim();
  const goals = String(project.business_goals || "").trim();
  const notes = String(project.intake_notes || "").trim();

  const hasStructured = Boolean(startup && audience && goals);

  if (!hasStructured) {
    return `## Client input

**Product / project name:** ${name}

**Founder description (verbatim):**

${String(project.description || "").trim()}

---

Generate the full HTML document with all required sections now.`;
  }

  let block = `## Client input (verbatim from founder)

**Product / project name:** ${name}

**Startup idea:**

${startup}

**Target audience:**

${audience}

**Business goals:**

${goals}`;

  if (notes) {
    block += `

**Optional notes:**

${notes}`;
  }

  block += `

---

Generate the full HTML document with all required sections now (Product overview through Architecture suggestions).`;

  return block;
}
