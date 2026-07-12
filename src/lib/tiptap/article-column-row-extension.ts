import { Node } from "@tiptap/core";
import {
  COLUMN_ROW_CLASS,
  columnRowCountClass,
  isColumnRowCount,
  parseColumnRowCountFromElement,
  type ColumnRowCount,
} from "@/lib/article-column-row";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    articleColumnRow: {
      insertColumnRow: (columnCount: ColumnRowCount) => ReturnType;
    };
  }
}

function emptyColumnContent() {
  return [{ type: "paragraph" as const }];
}

export const ArticleColumnRow = Node.create({
  name: "articleColumnRow",
  group: "block",
  content: "column{2,3}",
  defining: true,
  isolating: true,

  parseHTML() {
    return [
      {
        tag: `div[class*="${COLUMN_ROW_CLASS}"]`,
        getAttrs: (element) => {
          const count = parseColumnRowCountFromElement(element as HTMLElement);
          return count ? { columnCount: count } : false;
        },
      },
    ];
  },

  addAttributes() {
    return {
      columnCount: {
        default: 2 as ColumnRowCount,
        parseHTML: (element) => parseColumnRowCountFromElement(element as HTMLElement) ?? 2,
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const count = isColumnRowCount(node.attrs.columnCount)
      ? node.attrs.columnCount
      : (Math.min(3, Math.max(2, node.childCount)) as ColumnRowCount);
    return [
      "div",
      {
        ...HTMLAttributes,
        class: `${COLUMN_ROW_CLASS} ${columnRowCountClass(count)}`,
        "data-column-count": String(count),
      },
      0,
    ];
  },

  addCommands() {
    return {
      insertColumnRow:
        (columnCount: ColumnRowCount) =>
        ({ chain }) => {
          const columns = Array.from({ length: columnCount }, () => ({
            type: "articleColumn",
            content: emptyColumnContent(),
          }));
          return chain()
            .insertContent({
              type: this.name,
              attrs: { columnCount },
              content: columns,
            })
            .run();
        },
    };
  },
});
