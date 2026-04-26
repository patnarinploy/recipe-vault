"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { SkeletonOpenBook } from "./Skeleton";
import BookReaderV2 from "./BookReaderV2";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function BookReaderModalV2({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset loading state each time modal opens (simulates async data fetch)
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 1400);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    /*
      White/55 semi-transparent backdrop so the library page is faintly
      visible behind, giving the feeling of a book "floating" over the page.
    */
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{
        zIndex: 9999,
        background: "rgba(0,0,0,0.5)",
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* Close button — always visible */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-4 right-4 z-[100] w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center text-stone-500 hover:text-stone-800 hover:shadow-lg transition-all"
        aria-label="ปิด"
      >
        <X className="w-5 h-5" />
      </button>

      {loading ? (
        <SkeletonOpenBook />
      ) : (
        <div className="anim-scale-in">
          <BookReaderV2 />
        </div>
      )}
    </div>,
    document.body
  );
}
