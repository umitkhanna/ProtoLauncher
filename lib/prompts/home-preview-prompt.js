export const HOME_PREVIEW_CLASSIFY_SYSTEM = `You classify whether a software product should have a visual home or landing screen that can be mocked as HTML.

Respond with JSON only, no markdown fences, on a single line:
{"eligible":true|false,"surface":"web"|"mobile"|"multi"|"none","reason":"short phrase"}

eligible=true when the product is a consumer or business web app, mobile app, PWA, SaaS with a UI, marketplace, dashboard product, or similar where a first-run home/landing screen is meaningful.

eligible=false for pure backend/APIs, ETL/data pipelines only, CLI-only tools, embedded firmware with no UI, libraries/SDKs, databases, or infrastructure where a landing page would be fictional.

surface: web (browser-first), mobile (phone-first), multi (both), none when ineligible.`;

export function buildHomePreviewClassifyUserPrompt(projectName, requirementsPlainText) {
  const name = String(projectName || "Project").trim().slice(0, 280);
  const body = String(requirementsPlainText || "").trim().slice(0, 24_000);
  return `Project name: ${name}

Requirements (plain text excerpt):
${body || "(empty)"}`;
}

export const HOME_PREVIEW_GENERATE_SYSTEM = `You are an expert product designer and front-end developer. You output ONE complete HTML5 document only (no markdown, no commentary before or after).

The document must be self-contained: all CSS in a single <style> in <head>. Do not use external stylesheets or script CDNs. Do not include <script> tags.

Design a polished marketing-style home or app home screen that reflects the product described. Include a nav/header, hero, 2–4 feature sections, and a footer. Use modern CSS (flex/grid), readable typography, and accessible contrast. Use placeholder blocks or CSS gradients instead of external images.

Use viewport meta: <meta name="viewport" content="width=device-width, initial-scale=1">.

The surface hint in the user message tells whether to bias layout for desktop web, mobile-first, or both (use responsive CSS for "multi").`;

export function buildHomePreviewGenerateUserPrompt(
  projectName,
  requirementsPlainText,
  surface,
) {
  const name = String(projectName || "Product").trim().slice(0, 280);
  const body = String(requirementsPlainText || "").trim().slice(0, 28_000);
  const s = String(surface || "multi").toLowerCase();
  return `Surface hint: ${s}

Project name: ${name}

Requirements (plain text):
${body || "(none)"}

Produce the full HTML document now.`;
}
