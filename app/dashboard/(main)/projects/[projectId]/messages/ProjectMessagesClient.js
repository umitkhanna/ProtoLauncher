"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/app/components/GlassCard";
import { Loader2 } from "lucide-react";

async function fetchJson(url, options) {
  const res = await fetch(url, { ...options, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export function ProjectMessagesClient({ projectId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const data = await fetchJson(`/api/dashboard/projects/${projectId}/messages`);
    setMessages(data.messages || []);
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function onSend(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError("");
    try {
      await fetchJson(`/api/dashboard/projects/${projectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      setBody("");
      await load();
    } catch (e) {
      setError(e.message || "Send failed.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <GlassCard className="flex items-center justify-center gap-3 p-12 text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        Loading…
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href={`/dashboard/projects?projectId=${encodeURIComponent(String(projectId))}`}
        className="text-sm font-medium text-violet-400 hover:text-violet-300"
      >
        ← Project workspace
      </Link>
      <GlassCard className="p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-zinc-50">Project message board</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Updates for the customer and answers to their questions stay on this thread.
        </p>
        {error ? (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <ul className="mt-6 max-h-[min(28rem,50vh)] space-y-3 overflow-y-auto border-y border-white/[0.06] py-4">
          {messages.length === 0 ? (
            <li className="text-sm text-zinc-500">No messages yet.</li>
          ) : (
            messages.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-3 py-2 text-sm"
              >
                <p className="text-xs text-zinc-500">
                  {m.author_name || m.author_email}{" "}
                  <span className="text-zinc-600">
                    · {new Date(m.created_at).toLocaleString()}
                  </span>
                </p>
                <p className="mt-1 whitespace-pre-wrap text-zinc-200">{m.body}</p>
              </li>
            ))
          )}
        </ul>

        <form onSubmit={onSend} className="mt-4 space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Write an update or reply…"
            className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {sending ? "Sending…" : "Post message"}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
