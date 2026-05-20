"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { th } from "./th";
import { en } from "./en";

export type Locale = "th" | "en";

// DeepString widens all leaf string literal types to string,
// so both `th` and `en` satisfy Dict regardless of their literal values.
type DeepString<T> = T extends string ? string : { [K in keyof T]: DeepString<T[K]> };
export type Dict = DeepString<typeof th>;

const DICT: Record<Locale, Dict> = { th: th as Dict, en: en as Dict };

type LocaleCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
};

const Ctx = createContext<LocaleCtx>({ locale: "th", setLocale: () => {}, t: th as Dict });

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "th";
  const cookieVal = document.cookie.match(/rv_locale=([^;]+)/)?.[1] as Locale | undefined;
  const stored = cookieVal ?? (localStorage.getItem("rv_locale") as Locale | null) ?? null;
  return (stored === "th" || stored === "en") ? stored : "th";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("rv_locale", l);
    document.cookie = `rv_locale=${l};path=/;max-age=31536000;SameSite=Lax`;
  }

  return <Ctx.Provider value={{ locale, setLocale, t: DICT[locale] }}>{children}</Ctx.Provider>;
}

export const useLocale = () => useContext(Ctx);
