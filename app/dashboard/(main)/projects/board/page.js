import { Suspense } from "react";
import { SprintBoardClient } from "./SprintBoardClient";

export const metadata = {
  title: "Sprint board",
};

export default function SprintBoardPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-white/[0.07] bg-zinc-900/40 p-10 text-center text-sm text-zinc-400">
          Loading…
        </div>
      }
    >
      <SprintBoardClient />
    </Suspense>
  );
}
