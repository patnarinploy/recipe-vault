"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Sun, Moon, Monitor, Globe, Type } from "lucide-react";
import Link from "next/link";
import { useTheme, type Theme } from "@/lib/theme";
import { useLocale, type Locale } from "@/lib/locale";
import { useReadingFont } from "@/lib/reading-font-context";
import { READING_FONTS } from "@/lib/reading-fonts";

export default function ReadingPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const { font: activeFont, setFont } = useReadingFont();
  const s = t.reading;

  const [flipType, setFlipType] = useState<"soft" | "hard">("soft");
  // Defer theme/locale active-button reads until after mount to avoid
  // the hydration snapshot (server: system/th) disagreeing with localStorage.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const v = localStorage.getItem("rv_page_flip_type");
    if (v === "hard" || v === "soft") setFlipType(v);
  }, []);

  function handleFlipType(type: "soft" | "hard") {
    setFlipType(type);
    localStorage.setItem("rv_page_flip_type", type);
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
    <div className="max-w-lg mx-auto">
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
          <div className="flex rounded-xl overflow-hidden border border-outline mb-3">
            {(["soft", "hard"] as const).map((type, i) => (
              <button
                key={type}
                type="button"
                onClick={() => handleFlipType(type)}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                  i === 1 ? "border-l border-outline" : ""
                } ${
                  flipType === type
                    ? "bg-orange-500 text-white"
                    : "bg-surface text-secondary hover:bg-elevated"
                }`}
              >
                {type === "soft" ? s.flipType.soft : s.flipType.hard}
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
          <div className="flex rounded-xl overflow-hidden border border-outline">
            {THEME_OPTIONS.map(({ value, Icon, label }, i) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium transition-colors ${
                  i > 0 ? "border-l border-outline" : ""
                } ${
                  activeTheme === value
                    ? "bg-orange-500 text-white"
                    : "bg-surface text-secondary hover:bg-elevated"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
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
          <div className="flex rounded-xl overflow-hidden border border-outline">
            {(["th", "en"] as const).map((lang, i) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLocale(lang)}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                  i === 1 ? "border-l border-outline" : ""
                } ${
                  activeLocale === lang
                    ? "bg-orange-500 text-white"
                    : "bg-surface text-secondary hover:bg-elevated"
                }`}
              >
                {lang === "th" ? s.language.th : s.language.en}
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
          <div className="grid grid-cols-2 gap-2">
            {READING_FONTS.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFont(f.id)}
                className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-colors ${
                  activeFontId === f.id
                    ? "border-orange-400 bg-orange-50 dark:bg-orange-950/20"
                    : "border-outline bg-elevated hover:border-outline hover:bg-elevated"
                }`}
              >
                <span className="text-xs text-muted mb-1">{f.name}</span>
                <span
                  className="text-base text-foreground leading-snug"
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
