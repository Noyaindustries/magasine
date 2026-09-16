import type { Editor } from "@tiptap/react";

/** Normalize a user-entered URL for TipTap / newsletter links. */
export function normalizeEditorHref(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^javascript:/i.test(trimmed)) return null;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

/**
 * Apply a link mark in TipTap.
 * - With a text selection: wraps the selection.
 * - With an empty caret: inserts the URL as linked text (otherwise nothing visible happens).
 */
export function applyEditorLink(editor: Editor, rawUrl: string): boolean {
  const href = normalizeEditorHref(rawUrl);
  if (!href) return false;

  const { empty } = editor.state.selection;

  if (empty) {
    const label = href.replace(/^https?:\/\//i, "");
    return editor
      .chain()
      .focus()
      .insertContent({
        type: "text",
        text: label,
        marks: [{ type: "link", attrs: { href } }],
      })
      .run();
  }

  return editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
}
