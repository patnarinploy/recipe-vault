import { requireAdmin } from "@/lib/session";
import { Sparkles, Wrench, Bug, Rocket, Settings2, GitCommitHorizontal } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import buildHistoryJson from "@/lib/build-history.json";

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
  feat:     { label: "New Feature",  Icon: Rocket,    color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  fix:      { label: "Bug Fix",      Icon: Bug,       color: "text-rose-600 bg-rose-50 border-rose-200"          },
  improve:  { label: "Improvement",  Icon: Sparkles,  color: "text-sky-600 bg-sky-50 border-sky-200"             },
  refactor: { label: "Refactor",     Icon: Wrench,    color: "text-violet-600 bg-violet-50 border-violet-200"    },
  chore:    { label: "Internal",     Icon: Settings2, color: "text-stone-500 bg-stone-50 border-stone-200"       },
  internal: { label: "Internal",     Icon: Settings2, color: "text-stone-500 bg-stone-50 border-stone-200"       },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
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

function BuildCard({ entry, isLatest }: { entry: BuildEntry; isLatest: boolean }) {
  return (
    <div className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden ${
      isLatest ? "border-orange-200" : "border-stone-100"
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
                ? "bg-orange-50 text-orange-600 border-orange-200"
                : "bg-stone-50 text-stone-500 border-stone-200"
            }`}>
              Build #{entry.build}
            </span>
            {isLatest && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                ล่าสุด
              </span>
            )}
            <CategoryBadge category={entry.category} />
          </div>
          <time className="text-xs text-stone-400 shrink-0 pt-0.5">{formatDate(entry.timestamp)}</time>
        </div>

        {/* Row 2: commit subject */}
        <h2 className="text-sm font-semibold text-stone-800 mb-2 leading-snug">{entry.subject}</h2>

        {/* Row 3: commit hash */}
        <div className="flex items-center gap-1.5">
          <GitCommitHorizontal className="w-3.5 h-3.5 text-stone-300 shrink-0" />
          <code className="text-[10px] text-stone-400 bg-stone-50 border border-stone-100 px-1.5 py-0.5 rounded font-mono">
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

  return (
    <AdminLayout title="Version History">
      <p className="text-sm text-stone-500 -mt-4 mb-6">
        ดูประวัติ Build, ฟีเจอร์ใหม่, การปรับปรุง และการแก้ไขระบบของ Recipe Vault
      </p>
      <div className="space-y-4">
        {BUILD_HISTORY.map((entry, i) => (
          <BuildCard key={entry.build} entry={entry} isLatest={i === 0} />
        ))}
      </div>
    </AdminLayout>
  );
}
