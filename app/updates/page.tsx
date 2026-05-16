import Link from "next/link";
import { ArrowLeft, Sparkles, Wrench, Bug } from "lucide-react";
import { UPDATES, type UpdateEntry } from "@/lib/updates";
import { BUILD_NUMBER } from "@/lib/build-version";

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

function SectionLabel({ type }: { type: "features" | "improvements" | "fixes" }) {
  const MAP = {
    features:     { label: "ฟีเจอร์ใหม่",  Icon: Sparkles, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    improvements: { label: "ปรับปรุง",      Icon: Wrench,   color: "text-sky-600 bg-sky-50 border-sky-200" },
    fixes:        { label: "แก้ไขบั๊ก",     Icon: Bug,      color: "text-rose-600 bg-rose-50 border-rose-200" },
  } as const;
  const { label, Icon, color } = MAP[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function UpdateCard({ entry, isLatest }: { entry: UpdateEntry; isLatest: boolean }) {
  const hasContent = (entry.features?.length ?? 0) + (entry.improvements?.length ?? 0) + (entry.fixes?.length ?? 0) > 0;
  return (
    <div className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden ${isLatest ? "border-orange-200" : "border-stone-100"}`}>
      {isLatest && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-amber-400" />
      )}

      <div className="px-5 py-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
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
          </div>
          <time className="text-xs text-stone-400 shrink-0 pt-0.5">{formatDate(entry.timestamp)}</time>
        </div>

        <h2 className="text-sm font-semibold text-stone-800 mb-3 leading-snug">{entry.title}</h2>

        {hasContent && (
          <div className="space-y-3">
            {(["features", "improvements", "fixes"] as const).map(type => {
              const items = entry[type];
              if (!items?.length) return null;
              return (
                <div key={type}>
                  <div className="mb-1.5">
                    <SectionLabel type={type} />
                  </div>
                  <ul className="space-y-1">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-stone-600">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-stone-300 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UpdatesPage() {
  // Merge static history with live BUILD_NUMBER so the latest entry always
  // reflects the actual running build even before a manual changelog entry is added.
  const entries = UPDATES[0]?.build === BUILD_NUMBER
    ? UPDATES
    : [{ build: BUILD_NUMBER, timestamp: new Date().toISOString(), title: "อัปเดตล่าสุด" }, ...UPDATES];

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับหน้าหลัก
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-800">อัปเดตระบบ</h1>
        <p className="text-sm text-stone-500 mt-1">ดูฟีเจอร์ใหม่ การปรับปรุง และประวัติการพัฒนา Recipe Vault</p>
      </div>

      <div className="space-y-4">
        {entries.map((entry, i) => (
          <UpdateCard key={entry.build} entry={entry} isLatest={i === 0} />
        ))}
      </div>
    </div>
  );
}
