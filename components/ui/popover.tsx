"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { motion } from "framer-motion";

export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverClose = PopoverPrimitive.Close;

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

export function PopoverContent({
  children, className = "",
  side = "bottom", align = "start", sideOffset = 6,
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content asChild side={side} align={align} sideOffset={sideOffset}>
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className={`z-50 bg-surface rounded-2xl shadow-xl border border-border p-3 ${className}`}
        >
          {children}
        </motion.div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

export function Popover({
  children, open, onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </PopoverPrimitive.Root>
  );
}
