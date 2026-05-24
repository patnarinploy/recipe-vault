"use client";

import { AnimatePresence, motion } from "framer-motion";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  danger?: boolean;
}

export function AlertDialog({
  open, onOpenChange, title, description,
  confirmLabel = "Confirm", cancelLabel = "Cancel",
  onConfirm, danger = false,
}: AlertDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[9998] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => onOpenChange(false)}
          />
          <motion.div
            role="alertdialog"
            aria-modal
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-sm bg-surface rounded-2xl shadow-2xl border border-border p-6"
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
          >
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description && <p className="text-sm text-secondary mt-1.5">{description}</p>}
            <div className="flex gap-2 justify-end mt-5">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-xl text-sm text-secondary bg-elevated hover:bg-border transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => { onConfirm(); onOpenChange(false); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors ${
                  danger ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
