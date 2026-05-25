"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// SANDBOX / PLAYGROUND
//
// This file is a free-form scratchpad. Claude modifies only this file (and
// SandboxClient) when the user asks to test UI changes — the showcase sections
// above remain untouched.
// ─────────────────────────────────────────────────────────────────────────────

export default function SandboxClient() {
  const [count, setCount] = useState(0);

  return (
    <div className="space-y-6">
      {/* ── Placeholder ─────────────────────────────────────────── */}
      <div className="rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-700/50 bg-orange-50/30 dark:bg-orange-900/5 p-8 text-center space-y-2">
        <p className="text-sm font-semibold text-orange-500">Sandbox พร้อมใช้งาน</p>
        <p className="text-xs text-muted">บอก Claude ให้เพิ่ม / ทดสอบ UI ที่นี่ — ไม่กระทบหน้า Showcase</p>
      </div>

      {/* ── Example: Counter ────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5 flex items-center gap-4">
        <button
          onClick={() => setCount(c => c - 1)}
          className="px-3 py-1.5 rounded-lg bg-elevated border border-border text-sm text-secondary hover:bg-border transition-colors"
        >
          −
        </button>
        <span className="text-lg font-bold text-foreground w-8 text-center">{count}</span>
        <button
          onClick={() => setCount(c => c + 1)}
          className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          +
        </button>
        <span className="text-xs text-muted ml-2">ตัวอย่าง Counter — ลบทิ้งได้เลย</span>
      </div>
    </div>
  );
}
