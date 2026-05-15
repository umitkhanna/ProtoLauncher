"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Undo2,
} from "lucide-react";
import "./requirements-editor.css";

function ToolbarButton({ onClick, active, disabled, children, title }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition disabled:opacity-40 ${
        active
          ? "border-violet-500/40 bg-violet-500/15 text-violet-100"
          : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.06]"
      }`}
    >
      {children}
    </button>
  );
}

export function RequirementsEditor({
  initialHtml,
  finalized,
  projectName,
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      ...(finalized
        ? []
        : [
            Placeholder.configure({
              placeholder:
                "Edit your specification. Use the toolbar for structure.",
            }),
          ]),
    ],
    content: initialHtml?.trim() ? initialHtml : "<p></p>",
    editable: !finalized,
  });

  const runSave = useCallback(
    async (doFinalize) => {
      if (!editor || finalized) return;
      setError("");
      setSaving(true);
      try {
        const html = editor.getHTML();
        const res = await fetch("/api/dashboard/requirements/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html, finalize: doFinalize }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Save failed.");
          setSaving(false);
          return;
        }
        if (doFinalize) {
          const pid = data.projectId;
          try {
            if (pid != null) sessionStorage.setItem("pl:pendingHomePreview", String(pid));
          } catch {
            /* ignore */
          }
          if (pid != null) {
            void fetch(`/api/dashboard/projects/${encodeURIComponent(String(pid))}/home-preview`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            }).catch(() => {});
          }
          const q =
            pid != null ? `?projectId=${encodeURIComponent(String(pid))}` : "";
          router.push(`/dashboard/projects${q}`);
          router.refresh();
        } else {
          router.refresh();
          setSaving(false);
        }
      } catch {
        setError("Network error.");
        setSaving(false);
      }
    },
    [editor, finalized, router],
  );

  if (!editor) {
    return (
      <div className="rounded-xl border border-white/[0.07] bg-zinc-950/50 p-8 text-center text-sm text-zinc-500">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projectName ? (
        <p className="text-sm text-zinc-400">
          Project:{" "}
          <span className="font-medium text-zinc-200">{projectName}</span>
        </p>
      ) : null}

      {finalized ? (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          This requirements document is finalized. You can read it here; use
          Projects for the next step.
        </p>
      ) : null}

      {!finalized ? (
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/[0.08] bg-zinc-950/60 p-2">
          <ToolbarButton
            title="Bold"
            disabled={saving}
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            disabled={saving}
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 2"
            disabled={saving}
            active={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Bullet list"
            disabled={saving}
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Numbered list"
            disabled={saving}
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <span className="mx-1 hidden h-6 w-px bg-white/10 sm:inline" />
          <ToolbarButton
            title="Undo"
            disabled={saving || !editor.can().undo()}
            active={false}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Redo"
            disabled={saving || !editor.can().redo()}
            active={false}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
        </div>
      ) : null}

      <div className="requirements-editor-surface overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950/40 shadow-inner shadow-black/30">
        <EditorContent editor={editor} className="tiptap-root" />
      </div>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {!finalized ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            disabled={saving}
            onClick={() => runSave(false)}
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-white/25 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => runSave(true)}
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-violet-500/15 transition hover:bg-zinc-100 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save final & continue to Projects"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
