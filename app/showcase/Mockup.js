function ChromeBar() {
  return (
    <div className="flex items-center gap-1.5 border-b border-white/[0.06] pb-2.5">
      <span className="h-2 w-2 rounded-full bg-red-400/70" />
      <span className="h-2 w-2 rounded-full bg-amber-400/70" />
      <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
      <span className="ml-2 h-2 w-24 rounded bg-zinc-700/60" />
    </div>
  );
}

function MockProductivity() {
  return (
    <div className="relative h-56 overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-950/80 p-4">
      <ChromeBar />
      <div className="mt-3 flex h-[calc(100%-2rem)] gap-3">
        <aside className="hidden w-1/4 shrink-0 space-y-1.5 sm:block">
          {["Inbox", "Today", "Agents", "Reports"].map((l, i) => (
            <div
              key={l}
              className={`rounded-md border border-transparent px-2 py-1.5 text-[10px] ${
                i === 0
                  ? "border-white/[0.06] bg-white/[0.03] text-zinc-200"
                  : "text-zinc-500"
              }`}
            >
              {l}
            </div>
          ))}
        </aside>
        <ul className="flex-1 space-y-2 overflow-hidden">
          {[
            { tag: "AI", color: "bg-violet-500/25", text: "Triage 14 customer requests" },
            { tag: "PR", color: "bg-emerald-500/25", text: "Review pricing experiment" },
            { tag: "QA", color: "bg-sky-500/25", text: "Run regression suite on staging" },
          ].map((row) => (
            <li
              key={row.text}
              className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2"
            >
              <span
                className={`inline-flex h-5 w-7 items-center justify-center rounded text-[9px] font-semibold text-zinc-100 ${row.color}`}
              >
                {row.tag}
              </span>
              <span className="text-[11px] text-zinc-300">{row.text}</span>
              <span className="ml-auto h-5 w-14 rounded-full bg-emerald-500/15" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MockAnalytics() {
  return (
    <div className="relative h-56 overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-950/80 p-4">
      <ChromeBar />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: "MAU", value: "12.8k", color: "from-violet-500/25" },
          { label: "MRR", value: "$84k", color: "from-emerald-500/25" },
          { label: "Churn", value: "1.8%", color: "from-sky-500/25" },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2"
          >
            <p className="text-[9px] uppercase tracking-wider text-zinc-500">
              {k.label}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white">{k.value}</p>
            <div
              className={`mt-1 h-1 w-full rounded bg-gradient-to-r ${k.color} to-transparent`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex h-20 items-end gap-1 rounded-lg border border-white/[0.06] bg-black/40 p-2">
        {[28, 42, 35, 56, 48, 70, 60, 84, 72, 92, 80].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-gradient-to-t from-violet-600/60 to-indigo-400/40"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function MockAutomation() {
  return (
    <div className="relative h-56 overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-950/80 p-4">
      <ChromeBar />
      <div className="relative mt-3 h-[calc(100%-2rem)] text-violet-400/40">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 320 140"
          fill="none"
          aria-hidden
        >
          <path
            d="M40 70 L120 40 M120 40 L200 70 M120 40 L200 110 M200 70 L280 70 M200 110 L280 70"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        </svg>
        <div className="relative grid h-full grid-cols-4 items-center">
          {[
            { label: "Trigger", color: "bg-violet-500/25" },
            { label: "Agent", color: "bg-indigo-500/25" },
            { label: "Approve", color: "bg-amber-500/25" },
            { label: "Deploy", color: "bg-emerald-500/25" },
          ].map((n, i) => (
            <div
              key={n.label}
              className="flex flex-col items-center gap-1.5"
              style={{ marginTop: i % 2 === 0 ? 0 : i === 1 ? -18 : 18 }}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] ${n.color}`}
              >
                <span className="h-2 w-2 rounded-full bg-white/80" />
              </span>
              <span className="text-[10px] text-zinc-400">{n.label}</span>
            </div>
          ))}
        </div>
        <p className="absolute bottom-1 right-1 rounded-md border border-white/[0.08] bg-zinc-950/90 px-2 py-1 text-[9px] text-zinc-400">
          Agent run · OK · 2.3s
        </p>
      </div>
    </div>
  );
}

const mockups = {
  productivity: MockProductivity,
  analytics: MockAnalytics,
  automation: MockAutomation,
  default: MockProductivity,
};

export function ShowcaseMockup({ variant }) {
  const Cmp = mockups[variant] ?? mockups.default;
  return <Cmp />;
}
