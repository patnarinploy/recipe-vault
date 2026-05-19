"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { READING_FONTS, DEFAULT_READING_FONT, type ReadingFont, type ReadingFontId } from "./reading-fonts";

type ReadingFontCtx = {
  font: ReadingFont;
  setFont: (id: ReadingFontId) => void;
};

const Ctx = createContext<ReadingFontCtx>({ font: DEFAULT_READING_FONT, setFont: () => {} });

export function ReadingFontProvider({ children }: { children: ReactNode }) {
  const [font, setFontState] = useState<ReadingFont>(DEFAULT_READING_FONT);

  useEffect(() => {
    const stored = localStorage.getItem("rv_reading_font") as ReadingFontId | null;
    if (stored) {
      const found = READING_FONTS.find(f => f.id === stored);
      if (found) {
        setFontState(found);
        document.documentElement.style.setProperty("--reading-font", `var(${found.variable})`);
      }
    }
  }, []);

  function setFont(id: ReadingFontId) {
    const found = READING_FONTS.find(f => f.id === id);
    if (!found) return;
    setFontState(found);
    localStorage.setItem("rv_reading_font", id);
    document.documentElement.style.setProperty("--reading-font", `var(${found.variable})`);
  }

  return <Ctx.Provider value={{ font, setFont }}>{children}</Ctx.Provider>;
}

export const useReadingFont = () => useContext(Ctx);
