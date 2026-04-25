"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import BookReaderModalV2 from "./BookReaderModalV2";

export default function BookV2Trigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
        title="เปิด Book Reader V2 (ทดสอบ)"
      >
        <BookOpen className="w-4 h-4" />
        <span className="text-xs font-mono">V2</span>
      </button>

      <BookReaderModalV2 open={open} onClose={() => setOpen(false)} />
    </>
  );
}
