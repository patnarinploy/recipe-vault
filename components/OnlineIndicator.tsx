type Status = "online" | "away" | "offline";

function getStatus(lastSeen: string | null | undefined): Status {
  if (!lastSeen) return "offline";
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 2 * 60 * 1000) return "online";
  if (diff < 15 * 60 * 1000) return "away";
  return "offline";
}

const CONFIG: Record<Status, { dot: string; label: string; tooltip: string }> = {
  online:  { dot: "bg-green-400",  label: "ออนไลน์",    tooltip: "ออนไลน์อยู่" },
  away:    { dot: "bg-yellow-400", label: "ไม่อยู่",    tooltip: "ไม่อยู่ที่คีย์บอร์ด" },
  offline: { dot: "bg-stone-300",  label: "ออฟไลน์",    tooltip: "ออฟไลน์" },
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
  const status = getStatus(lastSeen);
  const cfg    = CONFIG[status];
  const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

  return (
    <span className="inline-flex items-center gap-1.5 group relative" title={cfg.tooltip}>
      <span className={`${dotSize} rounded-full shrink-0 ${cfg.dot} ${status === "online" ? "animate-pulse" : ""}`} />
      {showLabel && (
        <span className="text-xs text-stone-400">{cfg.label}</span>
      )}
    </span>
  );
}
