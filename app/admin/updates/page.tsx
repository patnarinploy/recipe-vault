import { requireAdmin } from "@/lib/session";
import { Sparkles, Wrench, Bug, Rocket, Settings2, GitCommitHorizontal } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import buildHistoryJson from "@/lib/build-history.json";
import { getServerLocale } from "@/lib/locale/server";

export const revalidate = 0;

// ── Types ─────────────────────────────────────────────────────────────────────

type BuildCategory = "feat" | "fix" | "improve" | "refactor" | "chore" | "internal";

type BuildEntry = {
  build:     number;
  timestamp: string;
  subject:   string;
  hash:      string;
  category:  BuildCategory;
};

const BUILD_HISTORY = (buildHistoryJson as BuildEntry[]).slice().sort((a, b) => b.build - a.build);

// ── Category config ────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<BuildCategory, {
  label: string;
  Icon:  React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  feat:     { label: "New Feature",  Icon: Rocket,    color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/40" },
  fix:      { label: "Bug Fix",      Icon: Bug,       color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/40"                },
  improve:  { label: "Improvement",  Icon: Sparkles,  color: "text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800/40"                    },
  refactor: { label: "Refactor",     Icon: Wrench,    color: "text-violet-600 bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800/40"      },
  chore:    { label: "Internal",     Icon: Settings2, color: "text-muted bg-elevated border-border"                                                               },
  internal: { label: "Internal",     Icon: Settings2, color: "text-muted bg-elevated border-border"                                                               },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale === "en" ? "en-US" : "th-TH", {
    day:      "numeric",
    month:    "long",
    year:     "numeric",
    hour:     "2-digit",
    minute:   "2-digit",
    timeZone: "Asia/Bangkok",
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: BuildCategory }) {
  const { label, Icon, color } = CATEGORY_CONFIG[category];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function BuildCard({ entry, isLatest, latestLabel, locale }: { entry: BuildEntry; isLatest: boolean; latestLabel: string; locale: string }) {
  return (
    <div className={`relative bg-surface rounded-2xl border shadow-sm overflow-hidden ${
      isLatest ? "border-orange-200" : "border-border"
    }`}>
      {isLatest && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-amber-400" />
      )}
      <div className="px-5 py-4">

        {/* Row 1: build badge · latest tag · category badge · timestamp */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
              isLatest
                ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800/40"
                : "bg-elevated text-muted border-border"
            }`}>
              Build #{entry.build}
            </span>
            {isLatest && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                {latestLabel}
              </span>
            )}
            <CategoryBadge category={entry.category} />
          </div>
          <time className="text-xs text-muted shrink-0 pt-0.5">{formatDate(entry.timestamp, locale)}</time>
        </div>

        {/* Row 2: commit subject */}
        <h2 className="text-sm font-semibold text-foreground mb-2 leading-snug">{entry.subject}</h2>

        {/* Row 3: commit hash */}
        <div className="flex items-center gap-1.5">
          <GitCommitHorizontal className="w-3.5 h-3.5 text-muted shrink-0" />
          <code className="text-[10px] text-muted bg-elevated border border-border px-1.5 py-0.5 rounded font-mono">
            {entry.hash}
          </code>
        </div>

      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminUpdatesPage() {
  await requireAdmin();
  const { t, locale } = await getServerLocale();
  const upd = t.admin.updates;

  return (
    <AdminLayout title={upd.title} backLabel={t.admin.back}>
      <p className="text-sm text-secondary -mt-4 mb-6">
        {upd.subtitle}
      </p>
      <div className="space-y-4">
        {BUILD_HISTORY.map((entry, i) => (
          <BuildCard key={entry.build} entry={entry} isLatest={i === 0} latestLabel={upd.latest} locale={locale} />
        ))}
      </div>
    </AdminLayout>
  );
}
