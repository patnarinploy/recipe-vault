"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import BookReaderV2 from "./BookReaderV2";

interface Props {
  bookId: string | null;
  isOwner: boolean;
  onClose: () => void;
}

export default function BookReaderModalV2({ bookId, isOwner, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!bookId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [bookId, onClose]);

  if (!bookId || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ zIndex: 9999, background: "rgba(0,0,0,0.5)" }}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        className="fixed top-4 right-4 z-[10002] w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center text-stone-500 hover:text-stone-800 hover:shadow-lg transition-all"
        aria-label="ปิด"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="anim-scale-in">
        <BookReaderV2 bookId={bookId} isOwner={isOwner} onClose={onClose} />
      </div>
    </div>,
    document.body
  );
}
