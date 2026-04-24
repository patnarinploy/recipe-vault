"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  fullscreen?: boolean;
  hideChrome?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-2xl",
  fullscreen = false,
  hideChrome = false,
}: ModalProps) {
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

  if (!open) return null;

  if (fullscreen) {
    return (
      <div
        className="fixed inset-0 z-[60] anim-fade-in"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="absolute inset-0 bg-stone-900/70 backdrop-blur-md"
          onClick={onClose}
        />
        <div className="relative w-full h-full flex flex-col">
          {!hideChrome && (
            <button
              type="button"
              onClick={onClose}
              className="fixed top-4 right-4 z-[70] w-11 h-11 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-stone-600 hover:text-stone-800 transition-colors"
              aria-label="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 min-h-0 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm" />

      <div className="relative min-h-full flex items-start sm:items-center justify-center p-4 sm:p-6">
        <div
          className={`relative w-full ${maxWidth}`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="bg-white rounded-t-2xl border border-stone-100 border-b-0 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-800">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 -m-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-700 transition-colors"
                aria-label="ปิด"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
