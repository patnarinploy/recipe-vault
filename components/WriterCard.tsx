import { isAvatarUrl, emojiAvatarBg } from "@/lib/avatar";
import type { WriterInfo } from "@/lib/types";

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  admin:  { label: "👑 Admin",  className: "bg-orange-100 text-orange-600 border border-orange-200" },
  user:   { label: "📚 สมาชิก", className: "bg-stone-100  text-stone-500  border border-stone-200"  },
};

export default function WriterCard({ info }: { info: WriterInfo }) {
  const isUrl   = isAvatarUrl(info.avatar);
  const isEmoji = !!info.avatar && !isUrl;
  const bg      = isEmoji ? emojiAvatarBg(info.avatar!) : "#fed7aa";
  const initial = (info.display_name ?? info.username)[0].toUpperCase();

  const badge = info.role ? ROLE_BADGE[info.role] : null;

  return (
    <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100 text-center">
      {/* Avatar */}
      <div className="flex justify-center mb-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-white shadow-md overflow-hidden"
          style={{ background: isUrl ? "#f5f5f4" : bg }}
        >
          {isUrl ? (
            <img src={info.avatar!} alt={initial} className="w-full h-full object-cover" />
          ) : isEmoji ? (
            <span className="text-4xl leading-none">{info.avatar}</span>
          ) : (
            <span
              className="text-3xl font-bold text-white"
              style={{ background: "#f97316", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {initial}
            </span>
          )}
        </div>
      </div>

      {/* Name */}
      <h3 className="text-xl font-bold text-stone-800 leading-tight">
        {info.display_name ?? "กระรอกสายลับ"}
      </h3>
      {!info.display_name && (
        <p className="text-sm italic text-stone-300 mt-0.5">(ไม่ได้กำหนดนามแฝง)</p>
      )}
      <p className="text-sm text-stone-400 mt-1 mb-4">@{info.username}</p>

      <div className="w-10 h-px bg-orange-200 mx-auto mb-4" />

      {/* Bio */}
      {info.bio && (
        <p className="text-sm text-stone-600 leading-relaxed mb-4">{info.bio}</p>
      )}

      {/* Role badge */}
      {badge && (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
          {badge.label}
        </span>
      )}
    </div>
  );
}
