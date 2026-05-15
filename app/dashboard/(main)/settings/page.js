import { GlassCard } from "@/app/components/GlassCard";

export const metadata = {
  title: "Settings",
};

export default function DashboardSettingsPage() {
  return (
    <GlassCard className="p-8 sm:p-10">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Settings
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
        Settings
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
        Add profile, notifications, billing, and API keys here when you are ready.
      </p>
    </GlassCard>
  );
}
