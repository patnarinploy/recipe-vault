"use client";

import { getAchievements, type AchievementBadge } from "@/lib/achievements";
import { useLocale } from "@/lib/locale";

export type WriterAchievementsProps = {
  role?: "admin" | "user";
  isBanned?: boolean;
  booksCount?: number;
  recipesCount?: number;
  sharedCount?: number;
  createdAt?: string;
  statsLoading?: boolean;
};

const TIER_CHIP: Record<1 | 2 | 3 | 4 | 5 | "special", string> = {
  1: "bg-stone-100 dark:bg-stone-700/60 text-stone-500 dark:text-stone-300",
  2: "bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300",
  3: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300",
  4: "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300",
  5: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300",
  special: "bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-300",
};

function BadgeChip({ badge, label, highlight }: { badge: AchievementBadge; label: string; highlight?: boolean }) {
  return (
    <span
      title={badge.tooltip}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${TIER_CHIP[badge.tier]} ${highlight ? "ring-1 ring-amber-300/60 dark:ring-amber-600/40" : ""}`}
    >
      {badge.emoji} {label}
    </span>
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

  const secondaryBadges: AchievementBadge[] = [];
  if (achievements) {
    const { primaryTitle, bookTitle, recipeTitle, shareTitle, specialAchievements } = achievements;
    for (const b of [bookTitle, recipeTitle, shareTitle]) {
      if (b && b !== primaryTitle) secondaryBadges.push(b);
    }
    secondaryBadges.push(...specialAchievements);
  }

  if (statsLoading) {
    return (
      <div className="space-y-3">
        {isBanned && (
          <p className="text-xs font-medium text-red-500 dark:text-red-400">🚫 Banned</p>
        )}
        <div className="grid grid-cols-3 text-center gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="space-y-1">
              <div className="skeleton h-5 w-8 rounded mx-auto" />
              <div className="skeleton h-2.5 w-10 rounded mx-auto" />
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-1.5">
          <div className="skeleton h-5 w-24 rounded-full" />
          <div className="skeleton h-5 w-20 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Banned notice */}
      {isBanned && (
        <p className="text-xs font-medium text-red-500 dark:text-red-400">🚫 Banned</p>
      )}

      {/* Stats row — 3 numbers like a social profile */}
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

      {/* Achievement badges — flat minimal chips */}
      {achievements && (achievements.primaryTitle || secondaryBadges.length > 0) && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {achievements.primaryTitle && (
            <BadgeChip
              badge={achievements.primaryTitle}
              label={labels[achievements.primaryTitle.id] ?? achievements.primaryTitle.label}
              highlight
            />
          )}
          {secondaryBadges.map((b, i) => (
            <BadgeChip key={i} badge={b} label={labels[b.id] ?? b.label} />
          ))}
        </div>
      )}
    </div>
  );
}
