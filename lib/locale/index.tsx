"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { th } from "./th";
import { en } from "./en";

export type Locale = "th" | "en";

// Explicit structural type so both dictionaries are accepted regardless of
// their literal string values (TypeScript would reject `en` if Dict = typeof th).
export type Dict = {
  settings: {
    reading: {
      backToSettings: string;
      pageTitle: string;
      flipType: { label: string; description: string; soft: string; hard: string; descSoft: string; descHard: string };
      theme:    { label: string; description: string; system: string; light: string; dark: string };
      language: { label: string; description: string; th: string; en: string };
    };
  };
};

const DICT: Record<Locale, Dict> = { th, en };

type LocaleCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
};

const Ctx = createContext<LocaleCtx>({ locale: "th", setLocale: () => {}, t: th as Dict });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("th");

  useEffect(() => {
    const stored = localStorage.getItem("rv_locale") as Locale | null;
    if (stored === "th" || stored === "en") setLocaleState(stored);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("rv_locale", l);
  }

  return <Ctx.Provider value={{ locale, setLocale, t: DICT[locale] }}>{children}</Ctx.Provider>;
}

export const useLocale = () => useContext(Ctx);
