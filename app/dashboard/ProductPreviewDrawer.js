"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutTemplate, Loader2, Monitor, RefreshCw, Smartphone, X } from "lucide-react";

const SS_PENDING = "pl:pendingHomePreview";

function previewEndpoint(projectId) {
  if (projectId) {
    return `/api/dashboard/projects/${encodeURIComponent(String(projectId))}/home-preview`;
  }
  return "/api/dashboard/home-preview/latest";
}

export function ProductPreviewDrawer({ projectId }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);
  const pollRef = useRef(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const loadPreview = useCallback(
    async (opts = { silent: false, url: null }) => {
      const url = opts.url ?? previewEndpoint(projectId);
      if (!opts.silent) setLoading(true);
      setError("");
      try {
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Could not load preview.");
          setPayload(null);
          return;
        }
        setPayload(data);
      } catch {
        setError("Network error.");
        setPayload(null);
      } finally {
        if (!opts.silent) setLoading(false);
      }
    },
    [projectId],
  );

  useEffect(() => {
    if (!open) return;
    void loadPreview();
  }, [open, projectId, loadPreview]);

  useEffect(() => {
    let pending = null;
    try {
      pending = sessionStorage.getItem(SS_PENDING);
    } catch {
      pending = null;
    }
    if (!pending) return undefined;

    const url = `/api/dashboard/projects/${encodeURIComponent(pending)}/home-preview`;
    let attempts = 0;

    const tick = async () => {
      attempts += 1;
      if (attempts > 48) {
        stopPoll();
        try {
          sessionStorage.removeItem(SS_PENDING);
        } catch {
          /* ignore */
        }
        return;
      }
      try {
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
        const done =
          (data.html && String(data.html).trim().length > 0) ||
          (data.note != null && String(data.note).trim().length > 0);
        if (done) {
          try {
            sessionStorage.removeItem(SS_PENDING);
          } catch {
            /* ignore */
          }
          stopPoll();
          const match =
            projectId == null || String(projectId) === String(pending);
          if (match) setPayload(data);
        }
      } catch {
        /* ignore */
      }
    };

    void tick();
    pollRef.current = setInterval(tick, 2500);
    return () => stopPoll();
  }, [projectId, stopPoll]);

  const handleGenerate = useCallback(
    async (forceRegenerate = false) => {
      const id = payload?.projectId ?? projectId;
      if (!id) {
        setError("Select a project from the sidebar or open a project page.");
        return;
      }
      setGenerating(true);
      setError("");
      try {
        const res = await fetch(
          `/api/dashboard/projects/${encodeURIComponent(String(id))}/home-preview`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ force: forceRegenerate }),
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Generation failed.");
          setGenerating(false);
          await loadPreview();
          return;
        }
        await loadPreview();
      } catch {
        setError("Network error.");
      } finally {
        setGenerating(false);
      }
    },
    [payload?.projectId, projectId, loadPreview],
  );

  const html = payload?.html?.trim() ? payload.html : null;
  const note = payload?.note?.trim() ? payload.note : null;
  const finalized = Boolean(payload?.finalized);
  const resolvedName = payload?.projectName || "Project";

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="product-preview-drawer"
        title="Product screen preview"
        onClick={() => setOpen((o) => !o)}
        className="absolute left-0 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-1 rounded-r-xl border border-l-0 border-white/[0.1] bg-zinc-900/95 py-3 pl-1 pr-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 shadow-lg shadow-black/30 backdrop-blur-md transition hover:border-violet-500/30 hover:text-violet-200"
      >
        <LayoutTemplate className="h-4 w-4" aria-hidden />
        <span className="hidden max-w-[3.25rem] leading-tight sm:inline">Preview</span>
      </button>

      <div
        id="product-preview-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Product screen preview"
        className={[
          "absolute left-0 top-16 z-20 flex h-[calc(100%-4rem)] w-[min(100%,28rem)] max-w-[calc(100vw-1rem)] flex-col border-r border-white/[0.08] bg-zinc-950/98 shadow-2xl shadow-black/50 backdrop-blur-xl transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full pointer-events-none opacity-0",
        ].join(" ")}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-zinc-500">
              AI home screen
            </p>
            <p className="truncate text-sm font-medium text-zinc-100" title={resolvedName}>
              {resolvedName}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              title="Regenerate"
              disabled={generating || !finalized || !payload?.projectId}
              onClick={() => void handleGenerate(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-40"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden />
              )}
            </button>
            <button
              type="button"
              title="Close"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-300 transition hover:bg-white/[0.06]"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Loading…
            </div>
          ) : null}

          {!loading && error ? (
            <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {!loading && !error && !finalized ? (
            <p className="text-sm text-zinc-500">
              Finalize your requirements to generate a Claude mock of the product home screen.
            </p>
          ) : null}

          {!loading && finalized && !html && note ? (
            <p className="text-sm text-zinc-400">{note}</p>
          ) : null}

          {!loading && finalized && !html && !note ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">
                No preview yet. Generation may still be running after you finalized requirements.
              </p>
              <button
                type="button"
                disabled={generating}
                onClick={() => void handleGenerate(false)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Generating…
                  </>
                ) : (
                  "Generate preview"
                )}
              </button>
            </div>
          ) : null}

          {!loading && html ? (
            <div className="space-y-4">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  <Monitor className="h-3.5 w-3.5" aria-hidden />
                  Web
                </p>
                <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900 shadow-inner">
                  <iframe
                    title="Web preview"
                    className="h-[220px] w-full bg-white"
                    sandbox=""
                    srcDoc={html}
                  />
                </div>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  <Smartphone className="h-3.5 w-3.5" aria-hidden />
                  Mobile
                </p>
                <div className="flex justify-center">
                  <div className="w-[min(100%,280px)] overflow-hidden rounded-[1.75rem] border-[6px] border-zinc-800 bg-zinc-900 shadow-xl">
                    <iframe
                      title="Mobile preview"
                      className="h-[360px] w-full bg-white"
                      sandbox=""
                      srcDoc={html}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
