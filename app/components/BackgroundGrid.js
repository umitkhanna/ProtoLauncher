/**
 * Subtle dot / grid background with a radial mask so it fades at the edges.
 * Pattern color and alpha come from theme tokens (`--dot`, `--dot-alpha`),
 * so this stays legible against either palette.
 */
export function BackgroundGrid({
  variant = "dots",
  className = "",
  fade = "radial",
}) {
  const maskImage =
    fade === "radial"
      ? "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(0,0,0,1), rgba(0,0,0,0))"
      : fade === "top"
        ? "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))"
        : "none";

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className} ${
        variant === "lines" ? "bg-grid-lines" : "bg-grid-dots"
      }`}
      style={{
        WebkitMaskImage: maskImage,
        maskImage,
      }}
    />
  );
}
