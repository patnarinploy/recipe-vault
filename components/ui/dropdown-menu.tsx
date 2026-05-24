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
      <Transition
        show={open}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div
          ref={ref}
          style={{ transformOrigin: origin }}
          className={`bg-surface rounded-2xl shadow-xl border border-border p-1.5 flex flex-col gap-0.5 ${className}`}
          {...rest}
        >
          {children}
        </div>
      </Transition>
    );
  }
);
