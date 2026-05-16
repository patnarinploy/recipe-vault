import { X } from "lucide-react";
import { isAvatarUrl } from "@/lib/avatar";
import type { WriterInfo } from "@/lib/types";
import OnlineIndicator from "./OnlineIndicator";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/role";
import { getAchievements, TIER_BADGE_COLORS, SPECIAL_BADGE_COLOR, type AchievementBadge } from "@/lib/achievements";

function AchievBadge({ badge, size = "sm" }: { badge: AchievementBadge; size?: "sm" | "md" }) {
  const color = badge.tier === "special" ? SPECIAL_BADGE_COLOR : TIER_BADGE_COLORS[badge.tier];
  const cls   = size === "md"
    ? `inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-sm font-bold border ${color}`
    : `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`;
  return (
    <span className={cls} title={badge.tooltip}>
      {badge.emoji} {badge.label}
    </span>
  );
}

export default function WriterCard({ info, onClose, statsLoading = false }: {
  info: WriterInfo;
  onClose?: () => void;
  statsLoading?: boolean;
}) {
  const isUrl      = isAvatarUrl(info.avatar);
  const initial    = info.display_name?.[0]?.toUpperCase() ?? "?";
  const roleLabel  = info.role ? ROLE_LABELS[info.role] : null;
  const roleColor  = info.role ? ROLE_COLORS[info.role] : null;
  const isBanned   = info.status === "banned";
  const showPresence = "last_seen" in info;

  const hasStats = info.book_count !== undefined || info.recipe_count !== undefined || info.public_count !== undefined;
  const achievements = hasStats
    ? getAchievements({
        book_count:   info.book_count,
        recipe_count: info.recipe_count,
        public_count: info.public_count,
        created_at:   info.created_at,
      })
    : null;

  // Secondary achievement badges (all except primary)
  const secondaryBadges: AchievementBadge[] = [];
  if (achievements) {
    const { primaryTitle, bookTitle, recipeTitle, shareTitle, specialAchievements } = achievements;
    for (const b of [bookTitle, recipeTitle, shareTitle]) {
      if (b && b !== primaryTitle) secondaryBadges.push(b);
    }
    secondaryBadges.push(...specialAchievements);
  }

  return (
    <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100 text-center">

      {/* Close button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-orange-100 text-stone-400 hover:text-stone-600 transition-colors"
          aria-label="ปิด"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Avatar */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-white shadow-md overflow-hidden"
            style={{ background: isUrl ? "#f5f5f4" : "#f97316" }}
          >
            {isUrl ? (
              <img src={info.avatar!} alt={initial} draggable={false} className="w-full h-full object-cover pointer-events-none select-none" />
            ) : (
              <span className="text-3xl font-bold text-white">{initial}</span>
            )}
          </div>
          {showPresence && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white shadow flex items-center justify-center shrink-0">
              <OnlineIndicator lastSeen={info.last_seen} size="md" />
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <h3 className="text-xl font-bold text-stone-800 leading-tight">
        {info.display_name ?? ""}
      </h3>

      {/* Online status label */}
      {showPresence && (
        <div className="flex justify-center mt-1.5">
          <OnlineIndicator lastSeen={info.last_seen} showLabel size="sm" />
        </div>
      )}

      <div className="w-10 h-px bg-orange-200 mx-auto mt-4 mb-4" />

      {/* Bio */}
      {info.bio && (
        <p className="text-sm text-stone-600 leading-relaxed mb-4">{info.bio}</p>
      )}

      {/* Badges — skeleton while async stats are in-flight */}
      {statsLoading ? (
        <div className="space-y-2">
          {/* primary title skeleton */}
          <div className="flex justify-center">
            <div className="skeleton h-8 w-44 rounded-full" />
          </div>
          {/* secondary badges skeleton */}
          <div className="flex flex-wrap justify-center gap-1.5">
            <div className="skeleton h-6 w-20 rounded-full" />
            <div className="skeleton h-6 w-24 rounded-full" />
          </div>
          {/* stats + role skeleton */}
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            <div className="skeleton h-6 w-16 rounded-full" />
            <div className="skeleton h-6 w-20 rounded-full" />
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Primary title */}
          {achievements?.primaryTitle && (
            <div className="flex justify-center">
              <AchievBadge badge={achievements.primaryTitle} size="md" />
            </div>
          )}

          {/* Secondary achievement badges */}
          {secondaryBadges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {secondaryBadges.map((b, i) => (
                <AchievBadge key={i} badge={b} size="sm" />
              ))}
            </div>
          )}

          {/* Stats + role + ban */}
          {(isBanned || roleLabel || hasStats) && (
            <div className="flex flex-wrap justify-center gap-2 pt-1">
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
              {info.book_count !== undefined && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-500 border border-stone-200">
                  📖 {info.book_count} Books
                </span>
              )}
              {info.recipe_count !== undefined && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-500 border border-stone-200">
                  🍳 {info.recipe_count} Recipes
                </span>
              )}
              {info.public_count !== undefined && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                  🌐 {info.public_count} Shared
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
