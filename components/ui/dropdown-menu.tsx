"use client";

import { Transition } from "@headlessui/react";
import { forwardRef } from "react";

interface DropdownContentProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  children: React.ReactNode;
  className?: string;
  origin?: string;
}

export const DropdownContent = forwardRef<HTMLDivElement, DropdownContentProps>(
  function DropdownContent(
    { open, children, origin = "top right", className = "", ...rest },
    ref
  ) {
    return (
      <Transition show={open}>
        <div
          ref={ref}
          style={{ transformOrigin: origin }}
          className={[
            "bg-surface rounded-2xl shadow-xl border border-border p-1.5 flex flex-col gap-0.5",
            // Always-on transition — enter uses these values
            "transition ease-out duration-150",
            // Closed state (enter-from + leave-to): scaled down and invisible
            "data-[closed]:opacity-0 data-[closed]:scale-90",
            // Override timing for leave phase
            "data-[leave]:duration-100 data-[leave]:ease-in",
            className,
          ].join(" ")}
          {...rest}
        >
          {children}
        </div>
      </Transition>
    );
  }
);
