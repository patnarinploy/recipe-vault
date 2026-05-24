"use client";

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
      <div
        ref={ref}
        aria-hidden={!open}
        style={{ transformOrigin: origin }}
        className={[
          "transition",
          open
            ? "opacity-100 scale-100 duration-100 ease-out"
            : "opacity-0 scale-95 duration-75 ease-in pointer-events-none",
          "bg-surface rounded-2xl shadow-xl border border-border p-1.5 flex flex-col gap-0.5",
          className,
        ].join(" ")}
      >
        {children}
      </div>
    );
  }
);
