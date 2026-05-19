import { requireAdmin } from "@/lib/session";
import AdminLayout from "@/components/admin/AdminLayout";
import { ACHIEVEMENT_CATALOG, TIER_BADGE_COLORS, SPECIAL_BADGE_COLOR, type CatalogEntry } from "@/lib/achievements";
import { getServerLocale } from "@/lib/locale/server";
export const revalidate = 0;

const TIER_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "Tier 1",
  2: "Tier 2",
  3: "Tier 3",
  4: "Tier 4",
  5: "Tier 5",
};

function BadgePill({ entry, label }: { entry: CatalogEntry; label: string }) {
  const color = entry.tier === "special" ? SPECIAL_BADGE_COLOR : TIER_BADGE_COLORS[entry.tier];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {entry.emoji} {label}
    </span>
  );
}

function TierRow({ entry, label, condition, specialLabel }: {
  entry: CatalogEntry;
  label: string;
  condition: string;
  specialLabel: string;
}) {
  const tierLabel = entry.tier === "special" ? specialLabel : TIER_LABELS[entry.tier];
  const tierColor = entry.tier === "special"
    ? "text-rose-600 bg-rose-50 dark:bg-rose-900/20"
    : [
        "",
        "text-muted bg-elevated",
        "text-sky-600 bg-sky-50 dark:bg-sky-900/20",
        "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
        "text-violet-600 bg-violet-50 dark:bg-violet-900/20",
        "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
      ][entry.tier as number];

  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${tierColor}`}>
        {tierLabel}
      </span>
      <div className="flex-1 min-w-0">
        <BadgePill entry={entry} label={label} />
        <p className="text-xs text-muted mt-1">{condition}</p>
      </div>
    </div>
  );
}

type SectionCategory = "book" | "recipe" | "share" | "special";

function AchievSection({ category, meta, specialLabel, achievLabels, achievConditions }: {
  category: SectionCategory;
  meta: { title: string; emoji: string; desc: string };
  specialLabel: string;
  achievLabels: Record<string, string>;
  achievConditions: Record<string, string>;
}) {
  const entries = ACHIEVEMENT_CATALOG[category];
  return (
    <div>
      <div className="flex items-center gap-2 px-1 mb-2">
        <span className="text-base">{meta.emoji}</span>
        <div>
          <p className="text-sm font-semibold text-secondary">{meta.title}</p>
          <p className="text-xs text-muted">{meta.desc}</p>
        </div>
      </div>
      <div className="bg-surface rounded-2xl border border-border shadow-sm divide-y divide-border overflow-hidden">
        {entries.map((entry) => (
          <TierRow
            key={entry.id}
            entry={entry}
            label={achievLabels[entry.id] ?? entry.label}
            condition={achievConditions[entry.id] ?? entry.condition}
            specialLabel={specialLabel}
          />
        ))}
      </div>
    </div>
  );
}

export default async function AdminAchievementsPage() {
  await requireAdmin();
  const { t } = await getServerLocale();
  const adm = t.admin.achievements;

  const achievLabels = t.achievements as Record<string, string>;
  const achievConditions = adm.conditions as Record<string, string>;

  const sections: { category: SectionCategory; meta: { title: string; emoji: string; desc: string } }[] = [
    { category: "book",    meta: { title: adm.sections.book.title,    emoji: adm.sections.book.emoji,    desc: adm.sections.book.desc    } },
    { category: "recipe",  meta: { title: adm.sections.recipe.title,  emoji: adm.sections.recipe.emoji,  desc: adm.sections.recipe.desc  } },
    { category: "share",   meta: { title: adm.sections.share.title,   emoji: adm.sections.share.emoji,   desc: adm.sections.share.desc   } },
    { category: "special", meta: { title: adm.sections.special.title, emoji: adm.sections.special.emoji, desc: adm.sections.special.desc } },
  ];

  return (
    <AdminLayout title={adm.title} backLabel={t.admin.back} maxWidth="lg">
      {/* Tier legend */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm px-5 py-4 mb-6">
        <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3">{adm.tierLegend}</p>
        <div className="flex flex-wrap gap-2">
          {([1, 2, 3, 4, 5] as const).map(tier => (
            <span key={tier} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${TIER_BADGE_COLORS[tier]}`}>
              Tier {tier}
            </span>
          ))}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${SPECIAL_BADGE_COLOR}`}>
            {adm.special}
          </span>
        </div>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          {adm.tierNote}
        </p>
      </div>

      {/* Achievement sections */}
      <div className="space-y-6">
        {sections.map(({ category, meta }) => (
          <AchievSection
            key={category}
            category={category}
            meta={meta}
            specialLabel={adm.special}
            achievLabels={achievLabels}
            achievConditions={achievConditions}
          />
        ))}
      </div>
    </AdminLayout>
  );
}
