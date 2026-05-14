"use client";

import { useEffect } from "react";

const INTERVAL_MS = 60_000;

export default function Heartbeat() {
  useEffect(() => {
    async function ping() {
      if (document.visibilityState === "hidden") return;
      try { await fetch("/api/heartbeat", { method: "POST" }); } catch {}
    }

    ping();
    const id = setInterval(ping, INTERVAL_MS);
    document.addEventListener("visibilitychange", ping);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", ping);
    };
  }, []);

  return null;
}
