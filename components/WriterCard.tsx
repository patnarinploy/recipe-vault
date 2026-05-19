"use client";

import { X } from "lucide-react";
import { isAvatarUrl } from "@/lib/avatar";
import type { WriterInfo } from "@/lib/types";
import OnlineIndicator from "./OnlineIndicator";
import WriterAchievements from "./user/WriterAchievements";
import { useLocale } from "@/lib/locale";

export default function WriterCard({ info, onClose, statsLoading = false }: {
  info: WriterInfo;
  onClose?: () => void;
  statsLoading?: boolean;
}) {
  const { t } = useLocale();
  const isUrl        = isAvatarUrl(info.avatar);
  const initial      = info.display_name?.[0]?.toUpperCase() ?? "?";
  const showPresence = "last_seen" in info;

  return (
    <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-amber-950/20 rounded-2xl p-6 border border-orange-100 dark:border-orange-900/30 text-center">

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 text-muted hover:text-foreground transition-colors"
          aria-label={t.common.close}
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Avatar */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-white dark:border-white/20 shadow-md overflow-hidden"
            style={{ background: isUrl ? "#f5f5f4" : "#f97316" }}
          >
            {isUrl ? (
              <img src={info.avatar!} alt={initial} draggable={false} className="w-full h-full object-cover pointer-events-none select-none" />
            ) : (
              <span className="text-3xl font-bold text-white">{initial}</span>
            )}
          </div>
          {showPresence && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white dark:bg-stone-800 shadow flex items-center justify-center shrink-0">
              <OnlineIndicator lastSeen={info.last_seen} size="md" />
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <h3 className="text-xl font-bold text-foreground leading-tight">
        {info.display_name ?? ""}
      </h3>

      {/* Online status label */}
      {showPresence && (
        <div className="flex justify-center mt-1.5">
          <OnlineIndicator lastSeen={info.last_seen} showLabel size="sm" />
        </div>
      )}

      <div className="w-10 h-px bg-orange-200 dark:bg-orange-800/40 mx-auto mt-4 mb-4" />

      {/* Bio */}
      {info.bio && (
        <p className="text-sm text-secondary leading-relaxed mb-4">{info.bio}</p>
      )}

      {/* Role + Achievements */}
      <WriterAchievements
        role={info.role}
        isBanned={info.status === "banned"}
        booksCount={info.book_count}
        recipesCount={info.recipe_count}
        sharedCount={info.public_count}
        createdAt={info.created_at}
        statsLoading={statsLoading}
      />
    </div>
  );
}
