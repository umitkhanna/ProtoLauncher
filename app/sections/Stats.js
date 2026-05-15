import { AnimatedNumber } from "../components/AnimatedNumber";
import { AnimatedReveal } from "../components/AnimatedReveal";
import { SectionLabel } from "../components/SectionLabel";

const stats = [
  {
    label: "MVPs shipped this year",
    value: 12,
    suffix: "+",
    hint: "From idea to production traffic.",
  },
  {
    label: "Average launch window",
    value: 6,
    suffix: " wks",
    hint: "Discovery → live deployment.",
  },
  {
    label: "Founder NPS",
    value: 4.9,
    suffix: " / 5",
    hint: "Across the last 18 engagements.",
    decimals: 1,
  },
  {
    label: "Years of senior product engineering",
    value: 40,
    suffix: "+",
    hint: "Combined across the studio team.",
  },
];

export function Stats() {
  return (
    <section
      aria-labelledby="stats-heading"
      className="relative py-24 sm:py-28"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AnimatedReveal>
          <SectionLabel>By the numbers</SectionLabel>
          <h2
            id="stats-heading"
            className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            Velocity you can defend in a board meeting.
          </h2>
        </AnimatedReveal>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <AnimatedReveal key={s.label} delay={0.05 * i}>
              <li className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-6 transition hover:border-white/[0.12]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  <AnimatedNumber
                    value={s.value}
                    suffix={s.suffix}
                    decimals={s.decimals}
                  />
                </p>
                <p className="mt-3 text-sm font-medium text-zinc-300">
                  {s.label}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                  {s.hint}
                </p>
              </li>
            </AnimatedReveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
