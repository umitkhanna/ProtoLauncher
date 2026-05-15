import DOMPurify from "isomorphic-dompurify";

const FORBID_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "option",
  "link",
  "base",
];

/**
 * Sanitize a full HTML document for srcDoc preview (inline CSS allowed; no scripts).
 */
export function sanitizePreviewHtml(dirty) {
  return DOMPurify.sanitize(String(dirty || ""), {
    WHOLE_DOCUMENT: true,
    USE_PROFILES: { html: true },
    FORBID_TAGS,
    FORBID_ATTR: [
      "onabort",
      "onblur",
      "onchange",
      "onclick",
      "onerror",
      "onfocus",
      "oninput",
      "onload",
      "onmouseout",
      "onmouseover",
      "onreset",
      "onsubmit",
    ],
    ALLOW_DATA_ATTR: false,
  });
}
