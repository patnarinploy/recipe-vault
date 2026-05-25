"use client";

import { Minus, Plus } from "lucide-react";

interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function Stepper({ value, onChange, min = 1, max, step = 1 }: StepperProps) {
  function dec() { onChange(Math.max(min, value - step)); }
  function inc() {
    const next = value + step;
    onChange(max !== undefined ? Math.min(max, next) : next);
  }

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        className="px-3 py-2.5 rounded-l-xl border border-outline text-sm text-secondary hover:bg-elevated transition-colors border-r-0 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <input
        type="number"
        value={value}
        onChange={e => {
          const v = Number(e.target.value);
          if (!isNaN(v) && v >= min) {
            onChange(max !== undefined ? Math.min(max, Math.max(min, v)) : Math.max(min, v));
          }
        }}
        className="w-14 text-center border-y border-outline py-2.5 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={inc}
        disabled={max !== undefined && value >= max}
        className="px-3 py-2.5 rounded-r-xl border border-outline text-sm text-secondary hover:bg-elevated transition-colors border-l-0 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default Stepper;
