"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Sun, Moon, Monitor, Globe, Type } from "lucide-react";
import Link from "next/link";
import { useTheme, type Theme } from "@/lib/theme";
import { useLocale, type Locale } from "@/lib/locale";
import { useReadingFont } from "@/lib/reading-font-context";
import { READING_FONTS, type ReadingFontId } from "@/lib/reading-fonts";
import { updateReadingPreferences } from "@/app/actions/auth";

type ReadingPreferences = {
  theme?: string;
  locale?: string;
  reading_font?: string;
  page_flip_type?: string;
};

export default function ReadingSettingsClient({
  initialPreferences,
}: {
  initialPreferences: ReadingPreferences;
}) {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const { font: activeFont, setFont } = useReadingFont();
  const s = t.reading;

  const [flipType, setFlipType] = useState<"soft" | "hard">("soft");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("rv_page_flip_type");
    const resolved = (stored === "hard" || stored === "soft") ? stored : "soft";

    // DB preferences take priority on first load from a new device
    const dbFlip = initialPreferences.page_flip_type;
    const dbTheme = initialPreferences.theme;
    const dbLocale = initialPreferences.locale;
    const dbFont  = initialPreferences.reading_font;

    if (dbFlip === "soft" || dbFlip === "hard") {
      setFlipType(dbFlip);
      localStorage.setItem("rv_page_flip_type", dbFlip);
    } else {
      setFlipType(resolved);
    }

    if (dbTheme === "light" || dbTheme === "dark" || dbTheme === "system") {
      setTheme(dbTheme);
    }
    if (dbLocale === "th" || dbLocale === "en") {
      setLocale(dbLocale);
    }
    if (dbFont && READING_FONTS.some(f => f.id === dbFont)) {
      setFont(dbFont as ReadingFontId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFlipType(type: "soft" | "hard") {
    setFlipType(type);
    localStorage.setItem("rv_page_flip_type", type);
    updateReadingPreferences({ page_flip_type: type });
  }

  function handleTheme(value: Theme) {
    setTheme(value);
    updateReadingPreferences({ theme: value });
  }

  function handleLocale(value: Locale) {
    setLocale(value);
    updateReadingPreferences({ locale: value });
  }

  function handleFont(id: ReadingFontId) {
    setFont(id);
    updateReadingPreferences({ reading_font: id });
  }

  const activeTheme:  Theme  = mounted ? theme  : "system";
  const activeLocale: Locale = mounted ? locale : "th";
  const activeFontId = mounted ? activeFont.id : READING_FONTS[0].id;

  const THEME_OPTIONS: { value: Theme; Icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { value: "system", Icon: Monitor, label: s.theme.system },
    { value: "light",  Icon: Sun,     label: s.theme.light  },
    { value: "dark",   Icon: Moon,    label: s.theme.dark   },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-muted hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {s.backTo}
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6">{s.pageTitle}</h1>

      <div className="space-y-4">

        {/* ── Page flip ──────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-4.5 h-4.5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{s.flipType.label}</p>
              <p className="text-xs text-muted mt-0.5">{s.flipType.description}</p>
            </div>
          </div>
          <div className="relative flex rounded-xl border border-outline bg-elevated p-1 gap-1 mb-3">
            {(["soft", "hard"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleFlipType(type)}
                className="relative flex-1 py-3 text-sm font-medium rounded-lg"
              >
                {flipType === type && (
                  <motion.div
                    layoutId="flip-pill"
                    className="absolute inset-0 bg-orange-500 rounded-lg"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className={`relative z-10 transition-colors duration-150 ${
                  flipType === type ? "text-white" : "text-secondary"
                }`}>
                  {type === "soft" ? s.flipType.soft : s.flipType.hard}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">
            {flipType === "soft" ? s.flipType.descSoft : s.flipType.descHard}
          </p>
        </div>

        {/* ── Theme ──────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
              <Sun className="w-4.5 h-4.5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{s.theme.label}</p>
              <p className="text-xs text-muted mt-0.5">{s.theme.description}</p>
            </div>
          </div>
          <div className="relative flex rounded-xl border border-outline bg-elevated p-1 gap-1">
            {THEME_OPTIONS.map(({ value, Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleTheme(value)}
                className="relative flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium rounded-lg"
              >
                {activeTheme === value && (
                  <motion.div
                    layoutId="theme-pill"
                    className="absolute inset-0 bg-orange-500 rounded-lg"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className={`relative z-10 flex items-center gap-1.5 transition-colors duration-150 ${
                  activeTheme === value ? "text-white" : "text-secondary"
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Language ───────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
              <Globe className="w-4.5 h-4.5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{s.language.label}</p>
              <p className="text-xs text-muted mt-0.5">{s.language.description}</p>
            </div>
          </div>
          <div className="relative flex rounded-xl border border-outline bg-elevated p-1 gap-1">
            {(["th", "en"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLocale(lang)}
                className="relative flex-1 py-3 text-sm font-medium rounded-lg"
              >
                {activeLocale === lang && (
                  <motion.div
                    layoutId="locale-pill"
                    className="absolute inset-0 bg-orange-500 rounded-lg"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className={`relative z-10 transition-colors duration-150 ${
                  activeLocale === lang ? "text-white" : "text-secondary"
                }`}>
                  {lang === "th" ? s.language.th : s.language.en}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Reading Font ────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
              <Type className="w-4.5 h-4.5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{s.font.label}</p>
              <p className="text-xs text-muted mt-0.5">{s.font.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {READING_FONTS.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleFont(f.id as ReadingFontId)}
                className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-colors ${
                  activeFontId === f.id
                    ? "border-orange-400 bg-orange-50 dark:bg-orange-950/20"
                    : "border-outline bg-elevated hover:border-outline hover:bg-elevated"
                }`}
              >
                <span className="text-xs text-muted mb-1">{f.name}</span>
                <span
                  className="text-base text-foreground leading-snug w-full"
                  style={{ fontFamily: `var(${f.variable})` }}
                >
                  {s.font.preview}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
