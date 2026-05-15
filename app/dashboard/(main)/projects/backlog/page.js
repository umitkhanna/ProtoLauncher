import { Suspense } from "react";
import { BacklogPlannerClient } from "./BacklogPlannerClient";

export const metadata = {
  title: "Plan sprint",
};

export default function BacklogPlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-white/[0.07] bg-zinc-900/40 p-10 text-center text-sm text-zinc-400">
          Loading…
        </div>
      }
    >
      <BacklogPlannerClient />
    </Suspense>
  );
}
