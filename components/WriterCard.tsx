import { X } from "lucide-react";
import { isAvatarUrl } from "@/lib/avatar";
import type { WriterInfo } from "@/lib/types";
import OnlineIndicator from "./OnlineIndicator";

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  admin:  { label: "👑 Admin",  className: "bg-orange-100 text-orange-600 border border-orange-200" },
  user:   { label: "📚 สมาชิก", className: "bg-stone-100  text-stone-500  border border-stone-200"  },
};

export default function WriterCard({ info, onClose }: { info: WriterInfo; onClose?: () => void }) {
  const isUrl   = isAvatarUrl(info.avatar);
  const initial = info.display_name?.[0]?.toUpperCase() ?? "?";
  const badge   = info.role ? ROLE_BADGE[info.role] : null;
  const hasStats = info.book_count !== undefined || info.recipe_count !== undefined || info.public_count !== undefined;
  const showPresence = "last_seen" in info;

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
            <span className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow">
              <OnlineIndicator lastSeen={info.last_seen} size="md" />
            </span>
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

      {/* Badges */}
      {(badge || hasStats) && (
        <div className="flex flex-wrap justify-center gap-2">
          {badge && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
              {badge.label}
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
  );
}
