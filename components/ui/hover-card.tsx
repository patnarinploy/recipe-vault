"use client";

import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { AnimatePresence, motion } from "framer-motion";
import { createContext, use, useState } from "react";

// Animate-UI–style HoverCard: Radix primitives + framer-motion spring animation.
// Uses a controlled `open` state so AnimatePresence can drive the exit animation.

const OpenCtx = createContext(false);

interface HoverCardProps {
  children: React.ReactNode;
  openDelay?: number;
  closeDelay?: number;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export function HoverCard({ children, openDelay = 300, closeDelay = 150, open: openProp, onOpenChange }: HoverCardProps) {
  const [hoverOpen, setHoverOpen] = useState(false);
  const open = openProp !== undefined ? openProp : hoverOpen;
  function handleChange(v: boolean) {
    setHoverOpen(v);
    onOpenChange?.(v);
  }
  return (
    <HoverCardPrimitive.Root
      open={open}
      onOpenChange={handleChange}
      openDelay={openDelay}
      closeDelay={closeDelay}
    >
      <OpenCtx.Provider value={open}>{children}</OpenCtx.Provider>
    </HoverCardPrimitive.Root>
  );
}

export const HoverCardTrigger = HoverCardPrimitive.Trigger;

interface HoverCardContentProps
  extends React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> {
  children: React.ReactNode;
}

export function HoverCardContent({
  children,
  align = "center",
  sideOffset = 8,
  className = "",
  ...props
}: HoverCardContentProps) {
  const open = use(OpenCtx);
  return (
    <AnimatePresence>
      {open && (
        <HoverCardPrimitive.Portal forceMount>
          <HoverCardPrimitive.Content
            forceMount
            align={align}
            sideOffset={sideOffset}
            asChild
            {...props}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 6 }}
              animate={{ opacity: 1, scale: 1,    y: 0 }}
              exit={{    opacity: 0, scale: 0.92, y: 6 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className={`z-[10001] rounded-xl border border-border bg-surface shadow-xl ${className}`}
            >
              {children}
            </motion.div>
          </HoverCardPrimitive.Content>
        </HoverCardPrimitive.Portal>
      )}
    </AnimatePresence>
  );
}
