export const COLUMN_ROW_CLASS = "art-column-row";
export const COLUMN_CLASS = "art-column";

export const COLUMN_ROW_COUNT_CLASSES = [
  "art-column-row--2",
  "art-column-row--3",
] as const;

export type ColumnRowCount = 2 | 3;

export function columnRowCountClass(count: ColumnRowCount): string {
  return count === 3 ? "art-column-row--3" : "art-column-row--2";
}

export function isColumnRowCount(value: unknown): value is ColumnRowCount {
  return value === 2 || value === 3;
}

export function parseColumnRowCountFromElement(element: HTMLElement): ColumnRowCount | null {
  if (element.classList.contains("art-column-row--3")) return 3;
  if (element.classList.contains("art-column-row--2")) return 2;
  const columns = element.querySelectorAll(`div.${COLUMN_CLASS}`).length;
  if (columns === 3) return 3;
  if (columns === 2) return 2;
  return null;
}
