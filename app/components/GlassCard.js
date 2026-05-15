export function GlassCard({
  children,
  className = "",
  hoverGlow = false,
  as: Tag = "div",
  ...rest
}) {
  return (
    <Tag
      className={`rounded-2xl border border-white/[0.07] bg-zinc-900/40 shadow-glass backdrop-blur-xl transition duration-300 ${
        hoverGlow
          ? "hover:border-violet-500/25 hover:shadow-glow"
          : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
