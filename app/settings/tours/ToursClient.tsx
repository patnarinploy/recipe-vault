"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/lib/locale";
import { TOUR_KEY_BOOK_READER } from "@/components/TourResetPanel";

interface TourItem {
  key: string;
  icon: React.ElementType;
  titleKey: string;
  subKey: string;
}

const TOURS: TourItem[] = [
  { key: TOUR_KEY_BOOK_READER, icon: BookOpen, titleKey: "bookReader.title", subKey: "bookReader.sub" },
];

export default function ToursClient() {
  const { t } = useLocale();
  const s = t.settings.tours;
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const state: Record<string, boolean> = {};
    for (const tour of TOURS) {
      state[tour.key] = !!localStorage.getItem(tour.key);
    }
    setSeen(state);
    setMounted(true);
  }, []);

  function toggle(key: string) {
    const next = !seen[key];
    setSeen(prev => ({ ...prev, [key]: next }));
    if (next) {
      localStorage.setItem(key, "1");
    } else {
      localStorage.removeItem(key);
      if (key === TOUR_KEY_BOOK_READER) {
        for (const k of Object.keys(localStorage)) {
          if (k.startsWith("rv_book_tour_")) localStorage.removeItem(k);
        }
      }
    }
  }

  function getLabel(dotPath: string): string {
    const parts = dotPath.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let v: any = s;
    for (const p of parts) v = v?.[p];
    return typeof v === "string" ? v : dotPath;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-muted hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.settings.title}
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-1">{s.sectionLabel}</h1>
      <p className="text-sm text-muted mb-6">{s.sectionSub}</p>

      <div className="bg-surface rounded-2xl border border-border shadow-sm divide-y divide-border overflow-hidden">
        {mounted ? TOURS.map(({ key, icon: Icon, titleKey, subKey }) => {
          const isSeen = !!seen[key];
          return (
            <div key={key} className="flex items-center gap-3.5 px-5 py-4">
              {/* Toggle switch */}
              <button
                role="switch"
                aria-checked={isSeen}
                onClick={() => toggle(key)}
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                  isSeen ? "bg-green-500" : "bg-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    isSeen ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>

              {/* Icon */}
              <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-orange-500" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{getLabel(titleKey)}</p>
                <p className="text-xs text-muted mt-0.5">{getLabel(subKey)}</p>
              </div>

              {/* Badge */}
              <span className={`text-xs font-medium shrink-0 ${isSeen ? "text-green-600 dark:text-green-400" : "text-muted"}`}>
                {isSeen ? s.seen : s.unseen}
              </span>
            </div>
          );
        }) : (
          /* Skeleton while localStorage loads */
          TOURS.map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 px-5 py-4">
              <div className="skeleton w-11 h-6 rounded-full shrink-0" />
              <div className="skeleton w-8 h-8 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3.5 w-40 rounded" />
                <div className="skeleton h-3 w-64 rounded" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
