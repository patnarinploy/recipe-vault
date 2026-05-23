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

// Soft pastel background per tier — badge circle fill
const TIER_BG: Record<1 | 2 | 3 | 4 | 5 | "special", string> = {
  1:       "bg-stone-200/80   dark:bg-stone-600/60",
  2:       "bg-sky-200/80     dark:bg-sky-700/60",
  3:       "bg-emerald-200/80 dark:bg-emerald-700/60",
  4:       "bg-violet-200/80  dark:bg-violet-700/60",
  5:       "bg-amber-200/80   dark:bg-amber-600/60",
  special: "bg-rose-200/80    dark:bg-rose-700/60",
};

function BadgeCircle({ badge, label }: { badge: AchievementBadge; label: string }) {
  return (
    <div
      title={`${label}\n${badge.tooltip}`}
      className={`w-9 h-9 rounded-full flex items-center justify-center text-lg select-none cursor-default shadow-sm ${TIER_BG[badge.tier]}`}
    >
      {badge.emoji}
    </div>
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

  // Collect all badges: primary first, then secondaries
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
          {[0, 1, 2].map(i => (
            <div key={i} className="skeleton w-9 h-9 rounded-full" />
          ))}
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

      {/* Achievement badges — emoji circles */}
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
