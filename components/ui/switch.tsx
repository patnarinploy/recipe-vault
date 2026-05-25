"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { motion } from "framer-motion";
import { forwardRef, useState } from "react";

export const Switch = forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className = "", checked, defaultChecked, onCheckedChange, ...props }, ref) {
  const [localChecked, setLocalChecked] = useState(defaultChecked ?? false);
  const isOn = checked !== undefined ? checked : localChecked;

  return (
    <SwitchPrimitive.Root
      ref={ref}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={(v) => {
        setLocalChecked(v);
        onCheckedChange?.(v);
      }}
      className={`relative w-10 h-6 rounded-full shrink-0 transition-colors cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400
        data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-stone-200 dark:data-[state=unchecked]:bg-stone-700
        ${className}`}
      {...props}
    >
      <motion.div
        className="absolute top-1 left-1 w-4 h-4 bg-white dark:bg-stone-300 rounded-full shadow pointer-events-none"
        animate={{ x: isOn ? 16 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </SwitchPrimitive.Root>
  );
});
