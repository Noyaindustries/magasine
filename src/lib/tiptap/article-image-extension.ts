import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";
import {
  articleImageClassToLayout,
  articleImageLayoutToClass,
  isArticleImageLayout,
  type ArticleImageLayout,
} from "@/lib/article-image-layout";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    articleImage: {
      setImageLayout: (layout: ArticleImageLayout) => ReturnType;
      setImageCaption: (caption: string) => ReturnType;
    };
  }
}

declare module "@tiptap/extension-image" {
  interface SetImageOptions {
    layout?: ArticleImageLayout;
    caption?: string | null;
  }
}

function readFigureCaption(element: HTMLElement): string | null {
  const caption = element.querySelector("figcaption")?.textContent?.trim();
  return caption || null;
}

function readImageAttrs(element: HTMLElement) {
  const src = element.getAttribute("src");
  if (!src) return false;

  const parentFigure =
    element.tagName === "FIGURE" ? element : element.closest("figure") ?? undefined;
  const img =
    element.tagName === "IMG"
      ? element
      : (element.querySelector("img") as HTMLElement | null);

  if (!img) return false;

  const layoutSource = parentFigure ?? img;
  const fromData = layoutSource.getAttribute("data-image-layout");
  const layout = isArticleImageLayout(fromData)
    ? fromData
    : articleImageClassToLayout(layoutSource.getAttribute("class"));

  return {
    src: img.getAttribute("src"),
    alt: img.getAttribute("alt") ?? "",
    title: img.getAttribute("title"),
    layout,
    caption: parentFigure ? readFigureCaption(parentFigure) : null,
  };
}

export const ArticleImage = Image.extend({
  name: "image",

  addAttributes() {
    return {
      ...this.parent?.(),
      layout: {
        default: "block" as ArticleImageLayout,
        parseHTML: (element) => {
          const attrs = readImageAttrs(element as HTMLElement);
          return attrs && typeof attrs !== "boolean" ? attrs.layout : "block";
        },
        renderHTML: () => ({}),
      },
      caption: {
        default: null as string | null,
        parseHTML: (element) => {
          const el = element as HTMLElement;
          if (el.tagName === "FIGURE") {
            return readFigureCaption(el);
          }
          const parent = el.closest("figure");
          return parent ? readFigureCaption(parent) : null;
        },
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (element) => readImageAttrs(element as HTMLElement),
      },
      {
        tag: "img[src]",
        getAttrs: (element) => readImageAttrs(element as HTMLElement),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const layout = isArticleImageLayout(HTMLAttributes.layout) ? HTMLAttributes.layout : "block";
    const layoutClass = articleImageLayoutToClass(layout);
    const caption =
      typeof HTMLAttributes.caption === "string" ? HTMLAttributes.caption.trim() : "";

    const imgAttributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      class: null,
      "data-image-layout": null,
      caption: null,
      layout: null,
    });

    if (caption) {
      return [
        "figure",
        {
          class: layoutClass,
          "data-image-layout": layout,
        },
        ["img", imgAttributes],
        ["figcaption", {}, caption],
      ];
    }

    return [
      "img",
      mergeAttributes(imgAttributes, {
        class: layoutClass,
        "data-image-layout": layout,
      }),
    ];
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageLayout:
        (layout: ArticleImageLayout) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { layout }),
      setImageCaption:
        (caption: string) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, {
            caption: caption.trim() || null,
          }),
    };
  },
});
