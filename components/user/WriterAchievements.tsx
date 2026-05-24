"use client";

import { useState } from "react";
import { getAchievements, type AchievementBadge } from "@/lib/achievements";
import { useLocale } from "@/lib/locale";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

export type WriterAchievementsProps = {
  role?: "admin" | "user";
  isBanned?: boolean;
  booksCount?: number;
  recipesCount?: number;
  sharedCount?: number;
  createdAt?: string;
  statsLoading?: boolean;
};

// Circle background per tier
const TIER_BG: Record<1 | 2 | 3 | 4 | 5 | "special", string> = {
  1:       "bg-stone-200/80   dark:bg-stone-600/60",
  2:       "bg-sky-200/80     dark:bg-sky-700/60",
  3:       "bg-emerald-200/80 dark:bg-emerald-700/60",
  4:       "bg-violet-200/80  dark:bg-violet-700/60",
  5:       "bg-amber-200/80   dark:bg-amber-600/60",
  special: "bg-rose-200/80    dark:bg-rose-700/60",
};

// Pill color for the tier label inside the hover card
const TIER_PILL: Record<1 | 2 | 3 | 4 | 5 | "special", string> = {
  1:       "bg-stone-100   dark:bg-stone-700   text-stone-500   dark:text-stone-300",
  2:       "bg-sky-50      dark:bg-sky-900/40  text-sky-600     dark:text-sky-300",
  3:       "bg-emerald-50  dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300",
  4:       "bg-violet-50   dark:bg-violet-900/40 text-violet-600  dark:text-violet-300",
  5:       "bg-amber-50    dark:bg-amber-900/40 text-amber-600   dark:text-amber-300",
  special: "bg-rose-50     dark:bg-rose-900/40 text-rose-500    dark:text-rose-300",
};

const TIER_LABEL: Record<1 | 2 | 3 | 4 | 5 | "special", string> = {
  1: "Tier I", 2: "Tier II", 3: "Tier III", 4: "Tier IV", 5: "Tier V", special: "Special",
};

function BadgeCircle({ badge, label }: { badge: AchievementBadge; label: string }) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <HoverCard open={pinned || hovered} onOpenChange={setHovered} openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          onClick={() => setPinned(p => !p)}
          className={`w-9 h-9 rounded-full flex items-center justify-center text-lg select-none shadow-sm transition-transform hover:scale-110 active:scale-95 ${TIER_BG[badge.tier]}`}
        >
          {badge.emoji}
        </button>
      </HoverCardTrigger>

      <HoverCardContent className="p-3 w-44 text-left">
        {/* Emoji + name */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl leading-none">{badge.emoji}</span>
          <span className="text-sm font-semibold text-foreground leading-tight">{label}</span>
        </div>

        {/* Tier pill */}
        <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 ${TIER_PILL[badge.tier]}`}>
          {TIER_LABEL[badge.tier]}
        </span>

        {/* Condition */}
        <p className="text-xs text-muted leading-relaxed">{badge.tooltip}</p>
      </HoverCardContent>
    </HoverCard>
  );
}

export default function WriterAchievements({
  isBanned,
  booksCount,
  recipesCount,
  sharedCount,
  createdAt,
  statsLoading = false,
}: WriterAchievementsProps) {
  const { t } = useLocale();
  const labels = t.achievements as Record<string, string>;

  const hasStats = booksCount !== undefined || recipesCount !== undefined || sharedCount !== undefined;

  const achievements = hasStats
    ? getAchievements({ book_count: booksCount, recipe_count: recipesCount, public_count: sharedCount, created_at: createdAt })
    : null;

  const allBadges: AchievementBadge[] = [];
  if (achievements) {
    const { primaryTitle, bookTitle, recipeTitle, shareTitle, specialAchievements } = achievements;
    if (primaryTitle) allBadges.push(primaryTitle);
    for (const b of [bookTitle, recipeTitle, shareTitle]) {
      if (b && b !== primaryTitle) allBadges.push(b);
    }
    allBadges.push(...specialAchievements);
  }

  if (statsLoading) {
    return (
      <div className="space-y-4">
        {isBanned && <p className="text-xs font-medium text-red-500 dark:text-red-400">🚫 Banned</p>}
        <div className="grid grid-cols-3 text-center gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="space-y-1">
              <div className="skeleton h-5 w-8 rounded mx-auto" />
              <div className="skeleton h-2.5 w-10 rounded mx-auto" />
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map(i => <div key={i} className="skeleton w-9 h-9 rounded-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isBanned && (
        <p className="text-xs font-medium text-red-500 dark:text-red-400">🚫 Banned</p>
      )}

      {/* Stats row */}
      {hasStats && (
        <div className="grid grid-cols-3 text-center divide-x divide-orange-100 dark:divide-stone-700">
          <div className="px-1">
            <p className="text-base font-bold text-foreground">{booksCount ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted mt-0.5">{labels.statBooks ?? "Books"}</p>
          </div>
          <div className="px-1">
            <p className="text-base font-bold text-foreground">{recipesCount ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted mt-0.5">{labels.statRecipes ?? "Recipes"}</p>
          </div>
          <div className="px-1">
            <p className="text-base font-bold text-foreground">{sharedCount ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted mt-0.5">{labels.statShared ?? "Shared"}</p>
          </div>
        </div>
      )}

      {/* Achievement badge circles */}
      {allBadges.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {allBadges.map((b) => (
            <BadgeCircle key={b.id} badge={b} label={labels[b.id] ?? b.label} />
          ))}
        </div>
      )}
    </div>
  );
}
