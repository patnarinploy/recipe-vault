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
            className="fixed inset-0 bg-background flex flex-col overflow-auto"
            style={{ zIndex: 9999 }}
            role="dialog"
            aria-modal="true"
          >
            {!hideChrome && (
              <button
                type="button"
                onClick={onClose}
                className="fixed top-4 right-4 z-[100] w-11 h-11 rounded-full bg-surface/90 hover:bg-surface shadow-lg flex items-center justify-center text-secondary hover:text-foreground transition-colors"
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
          transition={{ duration: 0.2, ease: "easeOut" }}
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
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.92 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`relative w-full ${maxWidth}`}
              onClick={(e) => e.stopPropagation()}
            >
              {title && (
                <div className="bg-surface rounded-t-2xl border border-border border-b-0 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">{title}</h2>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 -m-1.5 rounded-lg hover:bg-elevated text-muted hover:text-foreground transition-colors"
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
