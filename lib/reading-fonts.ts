export type ReadingFontId =
  | "ibm-plex-sans-thai"
  | "sarabun"
  | "kanit"
  | "mitr"
  | "noto-sans-thai"
  | "prompt";

export type ReadingFont = {
  id: ReadingFontId;
  name: string;
  variable: string;        // CSS variable name, e.g. "--font-ibm-plex"
  previewText: string;     // rendered using this font
  lineHeightClass: string; // some fonts need different line-height
};

export const READING_FONTS: ReadingFont[] = [
  {
    id: "ibm-plex-sans-thai",
    name: "IBM Plex Sans Thai",
    variable: "--font-ibm-plex",
    previewText: "สูตรอาหารของฉัน",
    lineHeightClass: "leading-relaxed",
  },
  {
    id: "sarabun",
    name: "Sarabun",
    variable: "--font-sarabun",
    previewText: "สูตรอาหารของฉัน",
    lineHeightClass: "leading-relaxed",
  },
  {
    id: "kanit",
    name: "Kanit",
    variable: "--font-kanit",
    previewText: "สูตรอาหารของฉัน",
    lineHeightClass: "leading-loose",
  },
  {
    id: "mitr",
    name: "Mitr",
    variable: "--font-mitr",
    previewText: "สูตรอาหารของฉัน",
    lineHeightClass: "leading-relaxed",
  },
  {
    id: "noto-sans-thai",
    name: "Noto Sans Thai",
    variable: "--font-noto-sans-thai",
    previewText: "สูตรอาหารของฉัน",
    lineHeightClass: "leading-relaxed",
  },
  {
    id: "prompt",
    name: "Prompt",
    variable: "--font-prompt",
    previewText: "สูตรอาหารของฉัน",
    lineHeightClass: "leading-relaxed",
  },
] as const;

export const DEFAULT_READING_FONT = READING_FONTS[0];
