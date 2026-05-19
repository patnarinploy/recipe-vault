"use client";

import { ROLE_LABELS, ROLE_COLORS } from "@/lib/role";
import { getAchievements, TIER_BADGE_COLORS, SPECIAL_BADGE_COLOR, type AchievementBadge } from "@/lib/achievements";
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

// ── Shared badge tokens ────────────────────────────────────────────────────────
// Every badge uses one of two sizes; both share the same shape, weight, and gap.
// "sm" = role + secondary achievements  "lg" = primary title only

const BASE  = "inline-flex items-center gap-1.5 rounded-full font-semibold border";
const SM    = `${BASE} px-3 py-1 text-xs`;
const LG    = `${BASE} px-3.5 py-1.5 text-sm`;

// ── Badge components ───────────────────────────────────────────────────────────

function ChipSm({ className, children, title }: { className: string; children: React.ReactNode; title?: string }) {
  return <span className={`${SM} ${className}`} title={title}>{children}</span>;
}

function ChipLg({ className, children, title }: { className: string; children: React.ReactNode; title?: string }) {
  return <span className={`${LG} ${className}`} title={title}>{children}</span>;
}

function AchievBadge({ badge, primary = false, labelOverride }: { badge: AchievementBadge; primary?: boolean; labelOverride?: string }) {
  const color = badge.tier === "special" ? SPECIAL_BADGE_COLOR : TIER_BADGE_COLORS[badge.tier];
  const label = labelOverride ?? badge.label;
  return primary
    ? <ChipLg className={color} title={badge.tooltip}>{badge.emoji} {label}</ChipLg>
    : <ChipSm className={color} title={badge.tooltip}>{badge.emoji} {label}</ChipSm>;
}

function RolePill({ role, isBanned }: { role?: "admin" | "user"; isBanned?: boolean }) {
  const roleLabel = role ? ROLE_LABELS[role] : null;
  const roleColor = role ? ROLE_COLORS[role]  : null;
  if (!isBanned && !roleLabel) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {isBanned && (
        <ChipSm className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800">🚫 Banned</ChipSm>
      )}
      {roleLabel && roleColor && (
        <ChipSm className={roleColor}>{roleLabel}</ChipSm>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function WriterAchievements({
  role,
  isBanned,
  booksCount,
  recipesCount,
  sharedCount,
  createdAt,
  statsLoading = false,
}: WriterAchievementsProps) {
  const { t } = useLocale();
  const achievementLabels = t.achievements as Record<string, string>;

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
        <RolePill role={role} isBanned={isBanned} />
        <div className="flex justify-center">
          <div className="skeleton h-8 w-44 rounded-full" />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <div className="skeleton h-6 w-20 rounded-full" />
          <div className="skeleton h-6 w-24 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Role (always first) */}
      <RolePill role={role} isBanned={isBanned} />

      {/* Primary title — one step larger to signal hierarchy */}
      {achievements?.primaryTitle && (
        <div className="flex justify-center">
          <AchievBadge
            badge={achievements.primaryTitle}
            primary
            labelOverride={achievementLabels[achievements.primaryTitle.id] ?? achievements.primaryTitle.label}
          />
        </div>
      )}

      {/* Secondary badges — same size as role pill, flex-wrap grid */}
      {secondaryBadges.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {secondaryBadges.map((b, i) => (
            <AchievBadge
              key={i}
              badge={b}
              labelOverride={achievementLabels[b.id] ?? b.label}
            />
          ))}
        </div>
      )}
    </div>
  );
}
