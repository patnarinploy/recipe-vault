"use client";

import { useEffect, useState } from "react";

interface Status {
  ok: boolean;
  latencyMs: number;
  timestamp: string;
}

export default function DbStatus() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/db-status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() =>
        setStatus({ ok: false, latencyMs: 0, timestamp: new Date().toISOString() })
      );
  }, []);

  const tooltipText = status
    ? `${status.ok ? "Connected" : "Disconnected"} · ${status.latencyMs}ms · ${new Date(status.timestamp).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}`
    : "Checking…";

  return (
    <div className="group relative inline-flex items-center gap-1.5 cursor-default select-none">
      {/* Dot */}
      <span
        className={[
          "w-2 h-2 rounded-full transition-colors",
          status === null
            ? "bg-stone-300 animate-pulse"
            : status.ok
            ? "bg-green-400"
            : "bg-red-400",
        ].join(" ")}
      />

      {/* Label */}
      <span className="text-xs text-stone-400">
        {status === null ? "…" : status.ok ? "Database" : "Database"}
      </span>

      {/* Tooltip */}
      <div
        className="
          pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          px-2.5 py-1.5 bg-stone-800 text-white text-xs rounded-lg whitespace-nowrap
          opacity-0 group-hover:opacity-100 transition-opacity duration-150
        "
      >
        {tooltipText}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-800" />
      </div>
    </div>
  );
}
