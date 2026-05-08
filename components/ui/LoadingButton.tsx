"use client";

import { Loader2 } from "lucide-react";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pending: boolean;
  pendingLabel?: string;
  variant?: "primary" | "danger" | "ghost";
  size?: "sm" | "md";
}

const variantCls = {
  primary: "bg-orange-500 hover:bg-orange-600 text-white shadow-sm disabled:bg-orange-300",
  danger:  "bg-red-500 hover:bg-red-600 text-white shadow-sm disabled:bg-red-300",
  ghost:   "bg-stone-100 hover:bg-stone-200 text-stone-700 disabled:text-stone-400",
};

const sizeCls = {
  sm: "px-3.5 py-2 text-sm rounded-xl gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2",
};

export default function LoadingButton({
  pending,
  pendingLabel,
  variant = "primary",
  size = "md",
  children,
  className = "",
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={pending || disabled}
      className={`inline-flex items-center justify-center font-medium transition-colors
        ${variantCls[variant]} ${sizeCls[size]} ${className}
        disabled:cursor-not-allowed`}
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
