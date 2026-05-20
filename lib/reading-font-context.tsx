"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { READING_FONTS, DEFAULT_READING_FONT, type ReadingFont, type ReadingFontId } from "./reading-fonts";

type ReadingFontCtx = {
  font: ReadingFont;
  setFont: (id: ReadingFontId) => void;
};

const Ctx = createContext<ReadingFontCtx>({ font: DEFAULT_READING_FONT, setFont: () => {} });

function readStoredFont(): ReadingFont {
  if (typeof window === "undefined") return DEFAULT_READING_FONT;
  const stored = localStorage.getItem("rv_reading_font") as ReadingFontId | null;
  if (stored) {
    const found = READING_FONTS.find(f => f.id === stored);
    if (found) return found;
  }
  return DEFAULT_READING_FONT;
}

export function ReadingFontProvider({ children }: { children: ReactNode }) {
  const [font, setFontState] = useState<ReadingFont>(readStoredFont);

  // Apply CSS variable whenever font changes (including on initial mount)
  useEffect(() => {
    document.documentElement.style.setProperty("--reading-font", `var(${font.variable})`);
  }, [font]);

  function setFont(id: ReadingFontId) {
    const found = READING_FONTS.find(f => f.id === id);
    if (!found) return;
    setFontState(found);
    localStorage.setItem("rv_reading_font", id);
  }

  return <Ctx.Provider value={{ font, setFont }}>{children}</Ctx.Provider>;
}

export const useReadingFont = () => useContext(Ctx);
