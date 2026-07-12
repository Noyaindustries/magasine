import { Node } from "@tiptap/core";
import {
  INLINE_GALLERY_CLASS,
  INLINE_GALLERY_MIN_ITEMS,
  inlineGalleryItemsToDomChildren,
  normalizeInlineGalleryItems,
  parseInlineGalleryItemsFromElement,
  type InlineGalleryItem,
} from "@/lib/article-inline-gallery";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    articleInlineGallery: {
      insertInlineGallery: (items: InlineGalleryItem[]) => ReturnType;
      updateInlineGallery: (items: InlineGalleryItem[]) => ReturnType;
    };
  }
}

export const ArticleInlineGallery = Node.create({
  name: "articleInlineGallery",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      items: {
        default: [] as InlineGalleryItem[],
        parseHTML: (element) => parseInlineGalleryItemsFromElement(element as HTMLElement),
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `div[class*="${INLINE_GALLERY_CLASS}"]`,
        getAttrs: (element) => {
          const items = parseInlineGalleryItemsFromElement(element as HTMLElement);
          return items.length >= INLINE_GALLERY_MIN_ITEMS ? { items } : false;
        },
      },
    ];
  },

  renderHTML({ node }) {
    const items = normalizeInlineGalleryItems(node.attrs.items as InlineGalleryItem[]);
    return [
      "div",
      { class: INLINE_GALLERY_CLASS },
      ...inlineGalleryItemsToDomChildren(items),
    ];
  },

  addCommands() {
    return {
      insertInlineGallery:
        (items: InlineGalleryItem[]) =>
        ({ chain }) => {
          const normalized = normalizeInlineGalleryItems(items);
          if (normalized.length < INLINE_GALLERY_MIN_ITEMS) return false;
          return chain().insertContent({ type: this.name, attrs: { items: normalized } }).run();
        },
      updateInlineGallery:
        (items: InlineGalleryItem[]) =>
        ({ commands }) => {
          const normalized = normalizeInlineGalleryItems(items);
          if (normalized.length < INLINE_GALLERY_MIN_ITEMS) return false;
          return commands.updateAttributes(this.name, { items: normalized });
        },
    };
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.className = INLINE_GALLERY_CLASS;
      dom.setAttribute("contenteditable", "false");

      const render = (currentNode: typeof node) => {
        const items = normalizeInlineGalleryItems(currentNode.attrs.items as InlineGalleryItem[]);
        dom.replaceChildren(
          ...items.map((item) => {
            const figure = document.createElement("figure");
            figure.className = "art-inline-gallery__item";
            const img = document.createElement("img");
            img.src = item.url;
            img.alt = item.alt || item.caption || "";
            figure.appendChild(img);
            if (item.caption) {
              const caption = document.createElement("figcaption");
              caption.textContent = item.caption;
              figure.appendChild(caption);
            }
            return figure;
          })
        );
      };

      render(node);

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== this.name) return false;
          render(updatedNode);
          return true;
        },
      };
    };
  },
});

export type { InlineGalleryItem };
