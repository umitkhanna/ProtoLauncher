import DOMPurify from "isomorphic-dompurify";

const FORBID_TAGS = [
  "script",
  "style",
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
  "meta",
  "base",
];

/**
 * Sanitize HTML for storage and for feeding the rich-text editor (XSS-safe).
 */
export function sanitizeRequirementsHtml(dirty) {
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    FORBID_TAGS,
    ALLOW_DATA_ATTR: false,
  });
}
