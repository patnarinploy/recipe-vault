"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { createContext, use, useState } from "react";

export const TooltipProvider = TooltipPrimitive.Provider;

const OpenCtx = createContext(false);

export function Tooltip({
  children,
  delayDuration = 400,
}: {
  children: React.ReactNode;
  delayDuration?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <TooltipPrimitive.Root open={open} onOpenChange={setOpen} delayDuration={delayDuration}>
      <OpenCtx.Provider value={open}>{children}</OpenCtx.Provider>
    </TooltipPrimitive.Root>
  );
}

export const TooltipTrigger = TooltipPrimitive.Trigger;

interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  children: React.ReactNode;
}

export function TooltipContent({
  children,
  side = "top",
  sideOffset = 6,
  className = "",
  ...props
}: TooltipContentProps) {
  const open = use(OpenCtx);
  const yOffset = side === "top" ? 4 : side === "bottom" ? -4 : 0;
  return (
    <AnimatePresence>
      {open && (
        <TooltipPrimitive.Portal forceMount>
          <TooltipPrimitive.Content
            forceMount
            side={side}
            sideOffset={sideOffset}
            asChild
            {...props}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: yOffset }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: yOffset }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className={`z-[10002] rounded-lg bg-foreground text-background text-xs px-2.5 py-1.5 shadow-md select-none pointer-events-none ${className}`}
            >
              {children}
            </motion.div>
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      )}
    </AnimatePresence>
  );
}
