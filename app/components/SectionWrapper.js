export function SectionWrapper({
  as: Tag = "section",
  id,
  "aria-labelledby": ariaLabelledBy,
  className = "",
  containerClassName = "",
  children,
}) {
  return (
    <Tag
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={className}
    >
      <div
        className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${containerClassName}`}
      >
        {children}
      </div>
    </Tag>
  );
}
