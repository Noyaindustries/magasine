"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { uploadAdminMedia } from "@/lib/admin-upload";
import { toast } from "@/lib/toast";
import {
  isNewsletterBodyHtml,
  plainTextToNewsletterEditorHtml,
} from "@/lib/newsletter-body-html";
import {
  ImageIcon,
  Link2,
  List,
  ListOrdered,
  Quote,
} from "@/components/admin/cms/CmsIcons";

interface MediaRow {
  _id: string;
  title: string;
  url: string;
}

interface CmsNewsletterBodyEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function CmsNewsletterBodyEditor({
  value,
  onChange,
  placeholder = "Rédigez votre message…",
}: CmsNewsletterBodyEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageInputId = "cms-nl-image-input";
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState<MediaRow[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const normalizedInitial = isNewsletterBodyHtml(value)
    ? value
    : plainTextToNewsletterEditorHtml(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        heading: { levels: [2, 3] },
      }),
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: normalizedInitial,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: "cms-prose cms-newsletter-prose",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = isNewsletterBodyHtml(value)
      ? value
      : plainTextToNewsletterEditorHtml(value);
    if (next !== current && next !== "<p></p>") {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  const insertImage = useCallback(
    (src: string, alt?: string) => {
      if (!editor || !src.trim()) return;
      editor.chain().focus().setImage({ src: src.trim(), alt: alt?.trim() || "" }).run();
    },
    [editor]
  );

  const uploadImages = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    try {
      for (const file of list) {
        const { url } = await uploadAdminMedia(file, file.name);
        insertImage(url, file.name);
      }
      toast.success(list.length > 1 ? "Images insérées." : "Image insérée.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'upload.");
    }
  };

  const openLibrary = async () => {
    setLibraryOpen(true);
    setLibraryLoading(true);
    try {
      const res = await fetch("/api/admin/medias?kind=image&sort=recent");
      const data = (await res.json()) as { items?: MediaRow[]; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Impossible de charger la médiathèque.");
        setLibraryItems([]);
        return;
      }
      setLibraryItems(data.items ?? []);
    } catch {
      toast.error("Impossible de charger la médiathèque.");
      setLibraryItems([]);
    } finally {
      setLibraryLoading(false);
    }
  };

  const toolBtn = (
    label: React.ReactNode,
    action: () => void,
    active?: boolean,
    disabled?: boolean
  ) => (
    <button
      type="button"
      className={cn("etb2", active && "on")}
      onClick={action}
      disabled={disabled}
      aria-disabled={disabled}
    >
      {label}
    </button>
  );

  if (!editor) {
    return (
      <div className="cms-editor-wrap cms-newsletter-editor">
        <div className="etb" />
        <div className="ebody cms-editor-loading">Chargement de l'éditeur…</div>
      </div>
    );
  }

  return (
    <>
      <div className="cms-editor-wrap cms-newsletter-editor">
        <div className="etb">
          <select
            className="etsel"
            value={
              editor.isActive("heading", { level: 2 })
                ? "h2"
                : editor.isActive("heading", { level: 3 })
                  ? "h3"
                  : editor.isActive("blockquote")
                    ? "quote"
                    : "p"
            }
            onChange={(e) => {
              const v = e.target.value;
              if (v === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
              else if (v === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
              else if (v === "quote") editor.chain().focus().toggleBlockquote().run();
              else editor.chain().focus().setParagraph().run();
            }}
          >
            <option value="p">Paragraphe</option>
            <option value="h2">Titre H2</option>
            <option value="h3">Titre H3</option>
            <option value="quote">Citation</option>
          </select>
          <div className="etsep" />
          {toolBtn(<b>B</b>, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
          {toolBtn(<i>I</i>, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
          <div className="etsep" />
          {toolBtn(
            <List size={14} className="cms-icon" aria-hidden />,
            () => editor.chain().focus().toggleBulletList().run(),
            editor.isActive("bulletList")
          )}
          {toolBtn(
            <ListOrdered size={14} className="cms-icon" aria-hidden />,
            () => editor.chain().focus().toggleOrderedList().run(),
            editor.isActive("orderedList")
          )}
          {toolBtn(
            <Quote size={14} className="cms-icon" aria-hidden />,
            () => editor.chain().focus().toggleBlockquote().run(),
            editor.isActive("blockquote")
          )}
          <div className="etsep" />
          {toolBtn(
            <Link2 size={14} className="cms-icon" aria-hidden />,
            () => {
              const url = window.prompt("URL du lien");
              if (!url) return;
              editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            },
            editor.isActive("link")
          )}
          {toolBtn(
            <ImageIcon size={14} className="cms-icon" aria-hidden />,
            () => document.getElementById(imageInputId)?.click(),
            editor.isActive("image")
          )}
          {toolBtn("Médias", () => void openLibrary(), false)}
          <input
            ref={imageInputRef}
            id={imageInputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            multiple
            onChange={(e) => {
              const files = e.target.files;
              e.target.value = "";
              if (files?.length) void uploadImages(files);
            }}
          />
        </div>
        <EditorContent editor={editor} className="ebody" />
        <p className="cms-field-hint cms-newsletter-editor-hint">
          Utilisez <strong>Image</strong> pour téléverser une illustration, ou <strong>Médias</strong> pour
          en choisir une dans la bibliothèque.
        </p>
      </div>

      {libraryOpen && (
        <div
          className="cms-ad-modal-overlay"
          role="presentation"
          onClick={() => setLibraryOpen(false)}
        >
          <div
            className="cms-ad-modal cms-newsletter-media-modal"
            role="dialog"
            aria-labelledby="nl-media-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cms-ad-modal-head">
              <h3 id="nl-media-title">Choisir une illustration</h3>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setLibraryOpen(false)}>
                Fermer
              </button>
            </div>
            <div className="cms-newsletter-media-modal-body">
              {libraryLoading ? (
                <p className="cms-field-hint">Chargement…</p>
              ) : libraryItems.length === 0 ? (
                <p className="cms-field-hint">
                  Aucune image dans la médiathèque. Téléversez-en une avec le bouton Image.
                </p>
              ) : (
                <div className="cms-newsletter-media-grid">
                  {libraryItems.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      className="cms-newsletter-media-item"
                      title={item.title}
                      onClick={() => {
                        insertImage(item.url, item.title);
                        setLibraryOpen(false);
                        toast.success("Image insérée.");
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.url} alt={item.title} />
                      <span>{item.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
