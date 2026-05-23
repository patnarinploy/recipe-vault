"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { useLocale } from "@/lib/locale";

// Global localStorage key that records "book reader tour has been seen at least once"
export const TOUR_KEY_BOOK_READER = "rv_tour__book_reader";

interface TourItem {
  key: string;
  icon: React.ElementType;
  titleKey: string;
  subKey: string;
}

const TOURS: TourItem[] = [
  { key: TOUR_KEY_BOOK_READER, icon: BookOpen, titleKey: "bookReader.title", subKey: "bookReader.sub" },
];

export default function TourResetPanel() {
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
      // Mark as seen (user wants to skip / won't show automatically)
      localStorage.setItem(key, "1");
    } else {
      // Reset — clear all related per-book keys + the global key
      localStorage.removeItem(key);
      if (key === TOUR_KEY_BOOK_READER) {
        for (const k of Object.keys(localStorage)) {
          if (k.startsWith("rv_book_tour_")) localStorage.removeItem(k);
        }
      }
    }
  }

  if (!mounted) return null;

  function getLabel(dotPath: string): string {
    const parts = dotPath.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let v: any = s;
    for (const p of parts) v = v?.[p];
    return typeof v === "string" ? v : dotPath;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[11px] font-semibold text-muted uppercase tracking-widest">
          {s.sectionLabel}
        </p>
        <p className="text-xs text-muted">{s.sectionSub}</p>
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-sm divide-y divide-border overflow-hidden">
        {TOURS.map(({ key, icon: Icon, titleKey, subKey }) => {
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

              {/* Seen / Unseen badge */}
              <span className={`text-xs font-medium shrink-0 ${isSeen ? "text-green-600 dark:text-green-400" : "text-muted"}`}>
                {isSeen ? s.seen : s.unseen}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
