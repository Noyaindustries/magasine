export const INLINE_GALLERY_CLASS = "art-inline-gallery";
export const INLINE_GALLERY_ITEM_CLASS = "art-inline-gallery__item";

export const INLINE_GALLERY_MIN_ITEMS = 2;

export interface InlineGalleryItem {
  url: string;
  caption?: string;
  alt?: string;
}

export function normalizeInlineGalleryItems(items: InlineGalleryItem[] | undefined): InlineGalleryItem[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const normalized: InlineGalleryItem[] = [];

  for (const item of items) {
    const url = item.url?.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    normalized.push({
      url,
      alt: item.alt?.trim() || undefined,
      caption: item.caption?.trim() || undefined,
    });
  }

  return normalized;
}

export function parseInlineGalleryItemsFromElement(element: HTMLElement): InlineGalleryItem[] {
  return normalizeInlineGalleryItems(
    Array.from(element.querySelectorAll(`figure.${INLINE_GALLERY_ITEM_CLASS}`)).map((figure) => {
      const img = figure.querySelector("img");
      return {
        url: img?.getAttribute("src") ?? "",
        alt: img?.getAttribute("alt") ?? "",
        caption: figure.querySelector("figcaption")?.textContent?.trim() ?? "",
      };
    })
  );
}

export function inlineGalleryItemsToDomChildren(items: InlineGalleryItem[]): Array<string | [string, ...unknown[]]> {
  return items.flatMap((item) => {
    const figureChildren: Array<string | [string, Record<string, string>?, ...unknown[]]> = [
      [
        "img",
        {
          src: item.url,
          alt: item.alt || item.caption || "",
        },
      ],
    ];
    if (item.caption) {
      figureChildren.push(["figcaption", {}, item.caption]);
    }
    return [["figure", { class: INLINE_GALLERY_ITEM_CLASS }, ...figureChildren] as [string, ...unknown[]]];
  });
}
