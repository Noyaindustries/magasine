import { Node } from "@tiptap/core";
import { COLUMN_CLASS } from "@/lib/article-column-row";

export const ArticleColumn = Node.create({
  name: "articleColumn",
  content: "block+",
  group: "column",
  isolating: true,
  defining: true,

  parseHTML() {
    return [{ tag: `div.${COLUMN_CLASS}` }];
  },

  renderHTML() {
    return ["div", { class: COLUMN_CLASS }, 0];
  },
});
