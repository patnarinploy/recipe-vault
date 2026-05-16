import { ROLE_LABELS, ROLE_COLORS } from "@/lib/role";
import { getAchievements, TIER_BADGE_COLORS, SPECIAL_BADGE_COLOR, type AchievementBadge } from "@/lib/achievements";

export type WriterAchievementsProps = {
  role?: "admin" | "user";
  isBanned?: boolean;
  booksCount?: number;
  recipesCount?: number;
  sharedCount?: number;
  createdAt?: string;
  statsLoading?: boolean;
};

function AchievBadge({ badge, size = "sm" }: { badge: AchievementBadge; size?: "sm" | "lg" }) {
  const color = badge.tier === "special" ? SPECIAL_BADGE_COLOR : TIER_BADGE_COLORS[badge.tier];
  const cls   = size === "lg"
    ? `inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-sm font-bold border ${color}`
    : `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`;
  return (
    <span className={cls} title={badge.tooltip}>
      {badge.emoji} {badge.label}
    </span>
  );
}

function RolePill({ role, isBanned }: { role?: "admin" | "user"; isBanned?: boolean }) {
  const roleLabel = role ? ROLE_LABELS[role] : null;
  const roleColor = role ? ROLE_COLORS[role] : null;
  if (!isBanned && !roleLabel) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {isBanned && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600 border border-red-200">
          🚫 Banned
        </span>
      )}
      {roleLabel && roleColor && (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${roleColor}`}>
          {roleLabel}
        </span>
      )}
    </div>
  );
}

export default function WriterAchievements({
  role,
  isBanned,
  booksCount,
  recipesCount,
  sharedCount,
  createdAt,
  statsLoading = false,
}: WriterAchievementsProps) {
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
      <div className="space-y-2">
        {/* Role is known immediately — show it now */}
        <RolePill role={role} isBanned={isBanned} />
        {/* Achievement skeletons prevent layout shift while counts load */}
        <div className="flex justify-center">
          <div className="skeleton h-8 w-44 rounded-full" />
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          <div className="skeleton h-6 w-20 rounded-full" />
          <div className="skeleton h-6 w-24 rounded-full" />
        </div>
      </div>
    );
  }

  const hasAchievements = !!achievements?.primaryTitle || secondaryBadges.length > 0;

  return (
    <div className="space-y-2">
      <RolePill role={role} isBanned={isBanned} />

      {/* Primary title */}
      {achievements?.primaryTitle && (
        <div className="flex justify-center">
          <AchievBadge badge={achievements.primaryTitle} size="lg" />
        </div>
      )}

      {/* Secondary achievement badges */}
      {secondaryBadges.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {secondaryBadges.map((b, i) => (
            <AchievBadge key={i} badge={b} />
          ))}
        </div>
      )}

      {/* Edge case: stats loaded, zero achievements → role pill is enough, nothing extra */}
      {hasStats && !hasAchievements && null}
    </div>
  );
}
