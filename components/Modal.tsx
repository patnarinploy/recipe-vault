"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { pushModal, popModal, isTopModal } from "@/lib/modalStack";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  fullscreen?: boolean;
  hideChrome?: boolean;
  disableBackdropClick?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-2xl",
  fullscreen = false,
  hideChrome = false,
  disableBackdropClick = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const id = pushModal(onClose);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isTopModal(id)) { e.preventDefault(); onClose(); }
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      popModal(id);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const portal = typeof document !== "undefined" ? document.body : null;
  if (!portal) return null;

  /* ── Fullscreen variant (book reader, etc.) ── */
  if (fullscreen) {
    return createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            key="fullscreen-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed inset-0 bg-stone-50 flex flex-col overflow-auto"
            style={{ zIndex: 9999 }}
            role="dialog"
            aria-modal="true"
          >
            {!hideChrome && (
              <button
                type="button"
                onClick={onClose}
                className="fixed top-4 right-4 z-[100] w-11 h-11 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-stone-600 hover:text-stone-800 transition-colors"
                aria-label="ปิด"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {children}
          </motion.div>
        )}
      </AnimatePresence>,
      portal
    );
  }

  /* ── Standard centered modal ── */
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed inset-0 overflow-y-auto"
          style={{ zIndex: 9999 }}
          onClick={disableBackdropClick ? undefined : onClose}
          role="dialog"
          aria-modal="true"
        >
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm" />

          <div className="relative min-h-full flex items-center justify-center p-4 sm:p-6">
            <motion.div
              key="modal-panel"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
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
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    portal
  );
}
