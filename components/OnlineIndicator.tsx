"use client";

import { useLocale } from "@/lib/locale";

type Status = "online" | "away" | "offline";

function getStatus(lastSeen: string | null | undefined): Status {
  if (!lastSeen) return "offline";
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 2 * 60 * 1000) return "online";
  if (diff < 15 * 60 * 1000) return "away";
  return "offline";
}

const DOT_CLASSES: Record<Status, string> = {
  online:  "bg-green-400",
  away:    "bg-yellow-400",
  offline: "bg-stone-300",
};

export default function OnlineIndicator({
  lastSeen,
  showLabel = false,
  size = "md",
}: {
  lastSeen: string | null | undefined;
  showLabel?: boolean;
  size?: "sm" | "md";
}) {
  const { t } = useLocale();
  const status = getStatus(lastSeen);
  const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

  const labels: Record<Status, string> = {
    online:  t.status.online,
    away:    t.status.away,
    offline: t.status.offline,
  };
  const tooltips: Record<Status, string> = {
    online:  t.status.onlineNow,
    away:    t.status.awayTooltip,
    offline: t.status.offlineTooltip,
  };

  return (
    <span className="inline-flex items-center gap-1.5 group relative" title={tooltips[status]}>
      <span className={`${dotSize} rounded-full shrink-0 ${DOT_CLASSES[status]} ${status === "online" ? "animate-pulse" : ""}`} />
      {showLabel && (
        <span className="text-xs text-muted">{labels[status]}</span>
      )}
    </span>
  );
}
