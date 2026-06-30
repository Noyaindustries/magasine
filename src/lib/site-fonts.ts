export const DEFAULT_TYPOGRAPHY_PRESET = "canela-editorial" as const;

export type TypographyPresetId =
  | typeof DEFAULT_TYPOGRAPHY_PRESET
  | "libre-classic"
  | "playfair-source"
  | "lora-inter"
  | "merriweather-work"
  | "fraunces-editorial"
  | "dm-sans-unified";

export interface TypographyPreset {
  id: TypographyPresetId;
  label: string;
  description: string;
  editorialSample: string;
  uiSample: string;
  /** Google Fonts stylesheet URL (omit when using next/font or Adobe Canela only). */
  googleFontsHref?: string;
  editorialFamily: string;
  uiFamily: string;
}

export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
  {
    id: "canela-editorial",
    label: "Canela Editorial",
    description: "Premium magazine serif with DM Sans UI — requires Adobe Fonts kit.",
    editorialSample: "Independent journalism",
    uiSample: "Sections · Search · Sign in",
    editorialFamily:
      '"canela", var(--font-canela-fallback, "Libre Baskerville"), Georgia, "Times New Roman", serif',
    uiFamily: 'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
  },
  {
    id: "libre-classic",
    label: "Libre Classic",
    description: "Libre Baskerville headlines with DM Sans navigation and labels.",
    editorialSample: "Independent journalism",
    uiSample: "Sections · Search · Sign in",
    editorialFamily: 'var(--font-canela-fallback, "Libre Baskerville"), Georgia, "Times New Roman", serif',
    uiFamily: 'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
  },
  {
    id: "playfair-source",
    label: "Playfair & Source",
    description: "High-contrast Playfair Display with Source Sans 3 for UI.",
    editorialSample: "Independent journalism",
    uiSample: "Sections · Search · Sign in",
    googleFontsHref:
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Source+Sans+3:wght@400;500;600;700&display=swap",
    editorialFamily: '"Playfair Display", Georgia, "Times New Roman", serif',
    uiFamily: '"Source Sans 3", system-ui, sans-serif',
  },
  {
    id: "lora-inter",
    label: "Lora & Inter",
    description: "Warm Lora serif for reading with crisp Inter UI.",
    editorialSample: "Independent journalism",
    uiSample: "Sections · Search · Sign in",
    googleFontsHref:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap",
    editorialFamily: '"Lora", Georgia, "Times New Roman", serif',
    uiFamily: '"Inter", system-ui, sans-serif',
  },
  {
    id: "merriweather-work",
    label: "Merriweather News",
    description: "Newspaper-style Merriweather with Work Sans interface.",
    editorialSample: "Independent journalism",
    uiSample: "Sections · Search · Sign in",
    googleFontsHref:
      "https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400&family=Work+Sans:wght@400;500;600;700&display=swap",
    editorialFamily: '"Merriweather", Georgia, "Times New Roman", serif',
    uiFamily: '"Work Sans", system-ui, sans-serif',
  },
  {
    id: "fraunces-editorial",
    label: "Fraunces Display",
    description: "Expressive Fraunces titles with DM Sans UI.",
    editorialSample: "Independent journalism",
    uiSample: "Sections · Search · Sign in",
    googleFontsHref:
      "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&display=swap",
    editorialFamily: '"Fraunces", Georgia, "Times New Roman", serif',
    uiFamily: 'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
  },
  {
    id: "dm-sans-unified",
    label: "DM Sans Modern",
    description: "Clean sans-serif throughout — minimal and contemporary.",
    editorialSample: "Independent journalism",
    uiSample: "Sections · Search · Sign in",
    editorialFamily: 'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
    uiFamily: 'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
  },
];

const PRESET_MAP = new Map(TYPOGRAPHY_PRESETS.map((p) => [p.id, p]));

export function isTypographyPresetId(value: string): value is TypographyPresetId {
  return PRESET_MAP.has(value as TypographyPresetId);
}

export function getTypographyPreset(id?: string | null): TypographyPreset {
  if (id && isTypographyPresetId(id)) {
    return PRESET_MAP.get(id)!;
  }
  return PRESET_MAP.get(DEFAULT_TYPOGRAPHY_PRESET)!;
}

export function getTypographyCssVariables(preset: TypographyPreset): Record<string, string> {
  return {
    "--site-font-editorial": preset.editorialFamily,
    "--site-font-ui": preset.uiFamily,
    "--font-canela": preset.editorialFamily,
    "--f-editorial": preset.editorialFamily,
    "--f-display": preset.editorialFamily,
    "--f-serif": preset.editorialFamily,
    "--font-serif": preset.editorialFamily,
    "--f-body": preset.editorialFamily,
    "--f-ui": preset.uiFamily,
    "--f-menu": preset.uiFamily,
    "--f-article-title": preset.editorialFamily,
    "--f-article-body": preset.editorialFamily,
  };
}

export const TYPOGRAPHY_PRESET_IDS = TYPOGRAPHY_PRESETS.map((p) => p.id);
