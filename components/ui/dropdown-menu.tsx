"use client";

import { AnimatePresence, motion } from "framer-motion";
import { forwardRef } from "react";

interface DropdownContentProps {
  open: boolean;
  children: React.ReactNode;
  className?: string;
  origin?: string;
}

export const DropdownContent = forwardRef<HTMLDivElement, DropdownContentProps>(
  function DropdownContent(
    { open, children, origin = "top right", className = "" },
    ref
  ) {
    return (
      <AnimatePresence>
        {open && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.1, ease: "easeOut" } }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.075, ease: "easeIn" } }}
            style={{ transformOrigin: origin }}
            className={`bg-surface rounded-2xl shadow-xl border border-border p-1.5 flex flex-col gap-0.5 ${className}`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
