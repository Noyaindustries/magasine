"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { uploadAdminMedia } from "@/lib/admin-upload";
import { toast } from "@/lib/toast";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ImageIcon,
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

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false }),
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
    const current = editor.getHTML();
    if (value !== current && value !== "<p></p>") {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const toolBtn = (label: React.ReactNode, action: () => void, active?: boolean) => (
    <button type="button" className={cn("etb2", active && "on")} onClick={action}>
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
          () => imageInputRef.current?.click(),
          editor.isActive("image")
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
      <div className="ebody">
        <EditorContent editor={editor} />
      </div>
      <input
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
              editor.chain().focus().setImage({ src: url, alt: file.name }).run();
              toast.success("Image inserted from local server.");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Upload failed.");
            } finally {
              if (imageInputRef.current) imageInputRef.current.value = "";
            }
          })();
        }}
      />
    </div>
  );
}
