import { requireAdmin } from "@/lib/session";
import AdminLayout from "@/components/admin/AdminLayout";
import { ACHIEVEMENT_CATALOG, TIER_BADGE_COLORS, SPECIAL_BADGE_COLOR, type CatalogEntry } from "@/lib/achievements";

export const revalidate = 0;

const TIER_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "Tier 1",
  2: "Tier 2",
  3: "Tier 3",
  4: "Tier 4",
  5: "Tier 5",
};

const SECTION_META: Record<"book" | "recipe" | "share" | "special", { title: string; emoji: string; description: string }> = {
  book:    { title: "สายหนังสือ",     emoji: "📖", description: "ฉายาที่ได้จากจำนวนหนังสือที่สร้าง" },
  recipe:  { title: "สายสูตรอาหาร",  emoji: "🍳", description: "ฉายาที่ได้จากจำนวนสูตรอาหารทั้งหมด" },
  share:   { title: "สายแบ่งปัน",    emoji: "🌐", description: "ฉายาที่ได้จากจำนวนสูตรที่แชร์สาธารณะ" },
  special: { title: "ความสำเร็จพิเศษ", emoji: "⭐", description: "Badge ข้ามสาย ได้จากเงื่อนไขเฉพาะ" },
};

function BadgePill({ entry }: { entry: CatalogEntry }) {
  const color = entry.tier === "special" ? SPECIAL_BADGE_COLOR : TIER_BADGE_COLORS[entry.tier];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {entry.emoji} {entry.label}
    </span>
  );
}

function TierRow({ entry }: { entry: CatalogEntry }) {
  const tierLabel = entry.tier === "special" ? "พิเศษ" : TIER_LABELS[entry.tier];
  const tierColor = entry.tier === "special"
    ? "text-rose-600 bg-rose-50"
    : ["", "text-stone-500 bg-stone-50", "text-sky-600 bg-sky-50", "text-emerald-600 bg-emerald-50", "text-violet-600 bg-violet-50", "text-amber-600 bg-amber-50"][entry.tier as number];

  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${tierColor}`}>
        {tierLabel}
      </span>
      <div className="flex-1 min-w-0">
        <BadgePill entry={entry} />
        <p className="text-xs text-stone-400 mt-1">{entry.condition}</p>
      </div>
    </div>
  );
}

function AchievSection({ category }: { category: "book" | "recipe" | "share" | "special" }) {
  const entries = ACHIEVEMENT_CATALOG[category];
  const meta    = SECTION_META[category];
  return (
    <div>
      <div className="flex items-center gap-2 px-1 mb-2">
        <span className="text-base">{meta.emoji}</span>
        <div>
          <p className="text-sm font-semibold text-stone-700">{meta.title}</p>
          <p className="text-xs text-stone-400">{meta.description}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm divide-y divide-stone-100 overflow-hidden">
        {entries.map((entry, i) => (
          <TierRow key={i} entry={entry} />
        ))}
      </div>
    </div>
  );
}

export default async function AdminAchievementsPage() {
  await requireAdmin();

  return (
    <AdminLayout title="จัดการ Achievement" maxWidth="lg">
      {/* Tier legend */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4 mb-6">
        <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-3">ระดับ Tier</p>
        <div className="flex flex-wrap gap-2">
          {([1, 2, 3, 4, 5] as const).map(tier => (
            <span key={tier} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${TIER_BADGE_COLORS[tier]}`}>
              Tier {tier}
            </span>
          ))}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${SPECIAL_BADGE_COLOR}`}>
            พิเศษ
          </span>
        </div>
        <p className="text-xs text-stone-400 mt-3 leading-relaxed">
          แต่ละสายมี 5 ระดับ (Tier 1–5) • ฉายาหลักคือ Tier ที่สูงที่สุดของผู้ใช้ • เมื่อ Tier เท่ากัน สายหนังสือ &gt; สายสูตร &gt; สายแชร์
        </p>
      </div>

      {/* Achievement sections */}
      <div className="space-y-6">
        <AchievSection category="book" />
        <AchievSection category="recipe" />
        <AchievSection category="share" />
        <AchievSection category="special" />
      </div>
    </AdminLayout>
  );
}
