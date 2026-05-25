"use client";

import { X, UserPlus, UserCheck } from "lucide-react";
import { isAvatarUrl } from "@/lib/avatar";
import type { WriterInfo } from "@/lib/types";
import OnlineIndicator from "./OnlineIndicator";
import WriterAchievements from "./user/WriterAchievements";
import { useLocale } from "@/lib/locale";
import { useEffect, useState, useTransition } from "react";

export default function WriterCard({ info, onClose, statsLoading = false, currentUserId }: {
  info: WriterInfo;
  onClose?: () => void;
  statsLoading?: boolean;
  currentUserId?: string | null;
}) {
  const { t } = useLocale();
  const isUrl        = isAvatarUrl(info.avatar);
  const initial      = info.display_name?.[0]?.toUpperCase() ?? "?";
  const showPresence = "last_seen" in info;

  const canFollow = !!(info.user_id && currentUserId && info.user_id !== currentUserId);
  const [isFollowing, setIsFollowing] = useState(info.is_following ?? false);
  const [followerCount, setFollowerCount] = useState(info.follower_count ?? 0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => { setIsFollowing(info.is_following ?? false); }, [info.is_following]);
  useEffect(() => { setFollowerCount(info.follower_count ?? 0); }, [info.follower_count]);

  function handleFollow() {
    startTransition(async () => {
      const { toggleFollow } = await import("@/app/actions/follow");
      const res = await toggleFollow(info.user_id!);
      if ("error" in res) return;
      setIsFollowing(res.following);
      setFollowerCount(c => res.following ? c + 1 : Math.max(0, c - 1));
    });
  }

  return (
    <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-stone-800 dark:via-stone-800 dark:to-stone-800 rounded-2xl overflow-hidden p-6 border border-orange-100 dark:border-stone-700 text-center">

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

      {/* Avatar — status dot at top-right */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-white dark:border-stone-600 shadow-md overflow-hidden"
            style={{ background: isUrl ? "#f5f5f4" : "#f97316" }}
          >
            {isUrl ? (
              <img src={info.avatar!} alt={initial} draggable={false} className="w-full h-full object-cover pointer-events-none select-none" />
            ) : (
              <span className="text-3xl font-bold text-white">{initial}</span>
            )}
          </div>
          {showPresence && (
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-white dark:bg-stone-800 border-2 border-white dark:border-stone-600 shadow flex items-center justify-center shrink-0">
              <OnlineIndicator lastSeen={info.last_seen} size="md" />
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <h3 className="text-xl font-bold text-foreground leading-tight">
        {info.display_name ?? ""}
      </h3>

      {/* Bio — above divider, just below name */}
      {info.bio && (
        <p className="text-sm text-secondary leading-relaxed mt-2">{info.bio}</p>
      )}

      {/* Follow button */}
      {canFollow && (
        <div className="flex justify-center mt-3">
          <button
            type="button"
            onClick={handleFollow}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all disabled:opacity-50 ${
              isFollowing
                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {isFollowing
              ? <><UserCheck className="w-3.5 h-3.5" /> {t.library.following}</>
              : <><UserPlus className="w-3.5 h-3.5" /> {t.library.follow}</>}
          </button>
        </div>
      )}

      <div className="w-10 h-px bg-orange-200 dark:bg-stone-600/60 mx-auto mt-4 mb-4" />

      {/* Follower count */}
      {!!info.user_id && (
        <p className="text-xs text-muted mb-4">
          {statsLoading
            ? <span className="skeleton inline-block h-3 w-16 rounded align-middle" />
            : t.library.followerCount.replace("{n}", String(followerCount))
          }
        </p>
      )}

      {/* Stats + Achievements */}
      <WriterAchievements
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
