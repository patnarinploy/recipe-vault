import { isAvatarUrl, emojiAvatarBg } from "@/lib/avatar";
import { BookOpen } from "lucide-react";
import type { WriterInfo } from "@/lib/types";

export default function WriterCard({ info }: { info: WriterInfo }) {
  const displayName = info.display_name ?? info.username;
  const isUrl   = isAvatarUrl(info.avatar);
  const isEmoji = !!info.avatar && !isUrl;
  const bg      = isEmoji ? emojiAvatarBg(info.avatar!) : "#fed7aa";

  return (
    <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100 text-center">
      {/* Avatar */}
      <div className="flex justify-center mb-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-white shadow-md overflow-hidden"
          style={{ background: isUrl ? "#f5f5f4" : bg }}
        >
          {isUrl ? (
            <img src={info.avatar!} alt={displayName} className="w-full h-full object-cover" />
          ) : isEmoji ? (
            <span className="text-4xl leading-none">{info.avatar}</span>
          ) : (
            <span
              className="text-3xl font-bold text-white"
              style={{ background: "#f97316", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {displayName[0].toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Name */}
      <h3 className="text-xl font-bold text-stone-800 leading-tight">
        {info.display_name ?? (
          <span className="text-stone-500">{info.username}</span>
        )}
      </h3>
      <p className="text-sm text-stone-400 mt-0.5 mb-4">@{info.username}</p>

      <div className="w-10 h-px bg-orange-200 mx-auto mb-4" />

      {/* Bio */}
      {info.bio ? (
        <p className="text-sm text-stone-600 leading-relaxed">{info.bio}</p>
      ) : (
        <p className="text-sm text-stone-300 italic">ยังไม่มีคำอธิบายตัวตน</p>
      )}

      <div className="mt-5 flex items-center justify-center gap-1.5 text-orange-300">
        <BookOpen className="w-3.5 h-3.5" />
        <span className="text-xs">นักเขียนสูตรอาหาร</span>
      </div>
    </div>
  );
}
