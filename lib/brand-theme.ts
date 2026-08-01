export const BRAND_THEMES = [
  { value: "neutro", label: "Neutro", swatch: "oklch(0.205 0 0)" },
  { value: "azul", label: "Azul", swatch: "oklch(0.52 0.18 255)" },
  { value: "verde", label: "Verde", swatch: "oklch(0.5 0.15 150)" },
  { value: "violeta", label: "Violeta", swatch: "oklch(0.5 0.2 295)" },
] as const;

export type BrandTheme = (typeof BRAND_THEMES)[number]["value"];

export const DEFAULT_BRAND_THEME: BrandTheme = "azul";
export const BRAND_STORAGE_KEY = "r360-brand";

export const BRAND_INIT_SCRIPT = `
try {
  var b = localStorage.getItem('${BRAND_STORAGE_KEY}');
  if (b) document.documentElement.setAttribute('data-brand', b);
  else document.documentElement.setAttribute('data-brand', '${DEFAULT_BRAND_THEME}');
} catch (e) {
  document.documentElement.setAttribute('data-brand', '${DEFAULT_BRAND_THEME}');
}
`;
