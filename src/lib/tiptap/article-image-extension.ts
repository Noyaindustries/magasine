import Image from "@tiptap/extension-image";
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
    };
  }
}

declare module "@tiptap/extension-image" {
  interface SetImageOptions {
    layout?: ArticleImageLayout;
  }
}

export const ArticleImage = Image.extend({
  name: "image",

  addAttributes() {
    return {
      ...this.parent?.(),
      layout: {
        default: "block" as ArticleImageLayout,
        parseHTML: (element) => {
          const fromData = element.getAttribute("data-image-layout");
          if (isArticleImageLayout(fromData)) return fromData;
          return articleImageClassToLayout(element.getAttribute("class"));
        },
        renderHTML: (attributes) => {
          const layout = isArticleImageLayout(attributes.layout) ? attributes.layout : "block";
          return {
            class: articleImageLayoutToClass(layout),
            "data-image-layout": layout,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageLayout:
        (layout: ArticleImageLayout) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { layout }),
    };
  },
});
