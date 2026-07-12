"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { uploadAdminMedia } from "@/lib/admin-upload";
import { toast } from "@/lib/toast";
import { ArticleImage } from "@/lib/tiptap/article-image-extension";
import { ArticleColumn } from "@/lib/tiptap/article-column-extension";
import { ArticleColumnRow } from "@/lib/tiptap/article-column-row-extension";
import { ArticleInlineGallery } from "@/lib/tiptap/article-inline-gallery-extension";
import {
  INLINE_GALLERY_MIN_ITEMS,
  normalizeInlineGalleryItems,
  type InlineGalleryItem,
} from "@/lib/article-inline-gallery";
import {
  ARTICLE_IMAGE_LAYOUTS,
  ARTICLE_IMAGE_LAYOUT_LABELS,
  isArticleImageLayout,
  type ArticleImageLayout,
} from "@/lib/article-image-layout";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Columns2,
  Columns3,
  ImageIcon,
  LayoutGrid,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Video,
} from "@/components/admin/cms/CmsIcons";

interface CmsRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function CmsRichTextEditor({
  value,
  onChange,
  placeholder = "Continue writing your article here…",
}: CmsRichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const imageInputId = "cms-rt-image-input";
  const galleryInputId = "cms-rt-gallery-input";
  const [, setSelectionTick] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
      }),
      Link.configure({ openOnClick: false }),
      ArticleColumn,
      ArticleColumnRow,
      ArticleImage.configure({ inline: false }),
      ArticleInlineGallery,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: "cms-prose",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const bump = () => setSelectionTick((value) => value + 1);
    editor.on("selectionUpdate", bump);
    editor.on("transaction", bump);
    return () => {
      editor.off("selectionUpdate", bump);
      editor.off("transaction", bump);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current && value !== "<p></p>") {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const toolBtn = (label: React.ReactNode, action: () => void, active?: boolean, disabled?: boolean) => (
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
      <div className="cms-editor-wrap">
        <div className="etb" />
        <div className="ebody cms-editor-loading">Loading editor…</div>
      </div>
    );
  }

  const imageActive = editor.isActive("image");
  const galleryActive = editor.isActive("articleInlineGallery");
  const columnRowActive = editor.isActive("articleColumnRow");
  const columnActive = editor.isActive("articleColumn");
  const rawLayout = editor.getAttributes("image").layout;
  const imageLayout: ArticleImageLayout = isArticleImageLayout(rawLayout) ? rawLayout : "block";
  const galleryItems = normalizeInlineGalleryItems(
    editor.getAttributes("articleInlineGallery").items as InlineGalleryItem[]
  );

  const setImageLayout = (layout: ArticleImageLayout) => {
    editor.chain().focus().setImageLayout(layout).run();
  };

  const updateGalleryItems = (items: InlineGalleryItem[]) => {
    const normalized = normalizeInlineGalleryItems(items);
    if (normalized.length < INLINE_GALLERY_MIN_ITEMS) {
      editor.chain().focus().deleteSelection().run();
      return;
    }
    editor.chain().focus().updateInlineGallery(normalized).run();
  };

  const patchGalleryItem = (index: number, patch: Partial<InlineGalleryItem>) => {
    updateGalleryItems(
      galleryItems.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    );
  };

  const removeGalleryItem = (index: number) => {
    updateGalleryItems(galleryItems.filter((_, itemIndex) => itemIndex !== index));
  };

  const appendGalleryImages = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    try {
      const uploads = await Promise.all(
        list.map(async (file) => {
          const { url } = await uploadAdminMedia(file, file.name);
          return { url, alt: file.name } satisfies InlineGalleryItem;
        })
      );
      if (galleryActive) {
        updateGalleryItems([...galleryItems, ...uploads]);
      } else if (uploads.length >= INLINE_GALLERY_MIN_ITEMS) {
        editor.chain().focus().insertInlineGallery(uploads).run();
        toast.success("Galerie insérée.");
      } else {
        toast.error(`Sélectionnez au moins ${INLINE_GALLERY_MIN_ITEMS} images pour une galerie.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'upload.");
    }
  };

  return (
    <div className="cms-editor-wrap">
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
          <option value="p">Paragraph</option>
          <option value="h2">Heading H2</option>
          <option value="h3">Heading H3</option>
          <option value="quote">Quote</option>
        </select>
        <div className="etsep" />
        {toolBtn(<b>B</b>, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
        {toolBtn(<i>I</i>, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
        {toolBtn(<s>S</s>, () => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"))}
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
            const url = window.prompt("Link URL");
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
        {toolBtn(
          <LayoutGrid size={14} className="cms-icon" aria-hidden />,
          () => document.getElementById(galleryInputId)?.click(),
          galleryActive,
          false
        )}
        {toolBtn(
          <Columns2 size={14} className="cms-icon" aria-hidden />,
          () => editor.chain().focus().insertColumnRow(2).run(),
          columnRowActive && editor.getAttributes("articleColumnRow").columnCount === 2,
          false
        )}
        {toolBtn(
          <Columns3 size={14} className="cms-icon" aria-hidden />,
          () => editor.chain().focus().insertColumnRow(3).run(),
          columnRowActive && editor.getAttributes("articleColumnRow").columnCount === 3,
          false
        )}
        {toolBtn(
          <Video size={14} className="cms-icon" aria-hidden />,
          () => {
            const url = window.prompt("Video URL (YouTube, Vimeo…)");
            if (!url) return;
            editor
              .chain()
              .focus()
              .insertContent(
                `<p><a href="${url}" target="_blank" rel="noopener noreferrer">Watch video</a></p>`
              )
              .run();
          }
        )}
        {toolBtn(
          <Minus size={14} className="cms-icon" aria-hidden />,
          () => editor.chain().focus().setHorizontalRule().run()
        )}
        <div className="etsep" />
        {toolBtn(
          <AlignLeft size={14} className="cms-icon" aria-hidden />,
          () => editor.chain().focus().setTextAlign("left").run(),
          editor.isActive({ textAlign: "left" })
        )}
        {toolBtn(
          <AlignCenter size={14} className="cms-icon" aria-hidden />,
          () => editor.chain().focus().setTextAlign("center").run(),
          editor.isActive({ textAlign: "center" })
        )}
        {toolBtn(
          <AlignRight size={14} className="cms-icon" aria-hidden />,
          () => editor.chain().focus().setTextAlign("right").run(),
          editor.isActive({ textAlign: "right" })
        )}
      </div>
      <div className={cn("cms-image-layout-bar", imageActive && "cms-image-layout-bar--active")}>
        <span className="cms-image-layout-label">Illustration</span>
        {ARTICLE_IMAGE_LAYOUTS.map((layout) => (
          <button
            key={layout}
            type="button"
            className={cn(
              "cms-image-layout-btn",
              imageActive && imageLayout === layout && "on"
            )}
            disabled={!imageActive}
            title={
              layout === "float-left"
                ? "Image à gauche, texte à droite"
                : layout === "float-right"
                  ? "Image à droite, texte à gauche"
                  : "Image pleine largeur"
            }
            onClick={() => setImageLayout(layout)}
          >
            {ARTICLE_IMAGE_LAYOUT_LABELS[layout]}
          </button>
        ))}
        {!imageActive && (
          <span className="cms-image-layout-hint">Sélectionnez une image dans le texte.</span>
        )}
        <label className="cms-image-caption-field">
          <span className="cms-image-layout-label">Légende</span>
          <input
            type="text"
            className="input cms-image-caption-input"
            value={(editor.getAttributes("image").caption as string | null) ?? ""}
            disabled={!imageActive}
            placeholder="Texte sous l'illustration (facultatif)"
            onChange={(event) => {
              editor.chain().focus().setImageCaption(event.target.value).run();
            }}
          />
        </label>
      </div>
      <div
        className={cn("cms-column-row-bar", (columnRowActive || columnActive) && "cms-column-row-bar--active")}
      >
        <span className="cms-image-layout-label">Colonnes</span>
        {columnRowActive || columnActive ? (
          <span className="cms-image-layout-hint">
            Cliquez dans une colonne pour y saisir du texte ou insérer une illustration via le bouton
            image.
          </span>
        ) : (
          <span className="cms-image-layout-hint">
            Insérez une ligne à 2 ou 3 colonnes (texte et images par colonne). Sur mobile, les colonnes
            s&apos;empilent.
          </span>
        )}
      </div>
      <div className={cn("cms-inline-gallery-bar", galleryActive && "cms-inline-gallery-bar--active")}>
        <span className="cms-image-layout-label">Galerie inline</span>
        {galleryActive ? (
          <>
            <div className="cms-inline-gallery-items">
              {galleryItems.map((item, index) => (
                <div key={`${item.url}-${index}`} className="cms-inline-gallery-edit-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt="" className="cms-inline-gallery-edit-thumb" />
                  <input
                    type="text"
                    className="input cms-inline-gallery-edit-caption"
                    value={item.caption ?? ""}
                    placeholder="Légende"
                    onChange={(event) => patchGalleryItem(index, { caption: event.target.value })}
                  />
                  <button
                    type="button"
                    className="cms-inline-gallery-remove"
                    onClick={() => removeGalleryItem(index)}
                    title="Retirer l'image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="cms-quick-add"
              onClick={() => galleryInputRef.current?.click()}
            >
              + Ajouter une image
            </button>
          </>
        ) : (
          <span className="cms-image-layout-hint">
            Cliquez sur « Galerie » pour insérer 2 images ou plus, ou sélectionnez une galerie
            existante.
          </span>
        )}
      </div>
      <div className="ebody">
        <EditorContent editor={editor} />
      </div>
      <input
        id={imageInputId}
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="cms-hidden-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file || !editor) return;
          void (async () => {
            try {
              const { url } = await uploadAdminMedia(file, file.name);
              editor
                .chain()
                .focus()
                .setImage({ src: url, alt: file.name, layout: "block" })
                .run();
              toast.success("Image insérée.");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Upload failed.");
            } finally {
              if (imageInputRef.current) imageInputRef.current.value = "";
            }
          })();
        }}
      />
      <input
        id={galleryInputId}
        ref={galleryInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="cms-hidden-input"
        onChange={(event) => {
          const files = event.target.files;
          if (!files || !editor) return;
          void appendGalleryImages(files).finally(() => {
            if (galleryInputRef.current) galleryInputRef.current.value = "";
          });
        }}
      />
    </div>
  );
}
