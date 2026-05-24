"use client";

import { useEffect, useRef } from "react";
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
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    const id = pushModal(() => onCloseRef.current());
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isTopModal(id)) { e.preventDefault(); onCloseRef.current(); }
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      popModal(id);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

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

  /* ── Standard centered modal ──
     Backdrop and panel are separate AnimatePresence siblings so each
     motion.div is a direct child and runs its own initial→animate sequence.
     Nesting motion.div inside another animating motion.div in framer-motion v12
     causes the inner element to skip its initial animation. ── */
  return createPortal(
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm"
            style={{ zIndex: 9998 }}
            onClick={disableBackdropClick ? undefined : onClose}
          />
        )}
      </AnimatePresence>

      {/* Panel — pointer-events-none on container so backdrop click-to-close still fires */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="modal-panel"
            initial={{ opacity: 0, scale: 0.92, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 160, damping: 20 }}
            className="fixed inset-0 overflow-y-auto pointer-events-none"
            style={{ zIndex: 9999 }}
            role="dialog"
            aria-modal="true"
          >
            <div className="relative min-h-full flex items-center justify-center p-4 sm:p-6">
              <div
                className={`relative w-full pointer-events-auto ${maxWidth}`}
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    portal
  );
}
