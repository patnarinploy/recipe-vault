"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ComponentType } from "react";

export interface RadialMenuItem {
  id: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  action: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface RadialMenuProps {
  open: boolean;
  x: number;
  y: number;
  items: RadialMenuItem[];
  onClose: () => void;
}

const RADIUS = 76;

function getPosition(index: number, total: number): { x: number; y: number } {
  if (total === 1) return { x: 0, y: -RADIUS };
  // Arc from 195° to 345° — upper half fan, slightly tilted inward
  const startAngle = 195;
  const endAngle = 345;
  const angle = startAngle + ((endAngle - startAngle) / (total - 1)) * index;
  const rad = (angle * Math.PI) / 180;
  return {
    x: Math.cos(rad) * RADIUS,
    y: Math.sin(rad) * RADIUS,
  };
}

export function RadialMenu({ open, x, y, items, onClose }: RadialMenuProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Invisible backdrop */}
          <motion.div
            className="fixed inset-0 z-[10000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={onClose}
            onContextMenu={e => { e.preventDefault(); onClose(); }}
          />

          {/* Radial items anchored at click point */}
          <div
            className="fixed z-[10001] pointer-events-none"
            style={{ left: x, top: y }}
          >
            {/* Center pulse */}
            <motion.div
              className="absolute w-3 h-3 rounded-full bg-orange-400/50 -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
            />

            {items.map((item, i) => {
              const pos = getPosition(i, items.length);
              return (
                <motion.div
                  key={item.id}
                  className="absolute pointer-events-auto"
                  style={{ width: 44, height: 44, marginLeft: -22, marginTop: -22 }}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                  animate={{ x: pos.x, y: pos.y, scale: 1, opacity: item.disabled ? 0.4 : 1 }}
                  exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 26, delay: i * 0.04 }}
                >
                  <button
                    type="button"
                    disabled={item.disabled}
                    onClick={() => { item.action(); onClose(); }}
                    title={item.label}
                    className={`w-11 h-11 rounded-full shadow-xl border flex items-center justify-center transition-colors
                      ${item.danger
                        ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/50 text-red-500 hover:bg-red-100"
                        : "bg-surface border-border text-secondary hover:text-foreground hover:bg-elevated"
                      } disabled:pointer-events-none`}
                  >
                    <item.icon className="w-4 h-4" />
                  </button>
                  {/* Label appears below each button */}
                  <motion.div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-[9px] font-semibold tracking-wide text-foreground bg-surface/95 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-border/60 shadow-sm pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.04 + 0.12 }}
                  >
                    {item.label}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
