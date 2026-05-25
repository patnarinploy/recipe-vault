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
    <div className="border border-outline rounded-xl overflow-hidden bg-surface">
      <div className="flex justify-between items-center">
        <div className="grow py-2 px-3">
          <input
            type="number"
            value={value}
            onChange={e => {
              const v = Number(e.target.value);
              if (!isNaN(v)) {
                onChange(max !== undefined ? Math.min(max, Math.max(min, v)) : Math.max(min, v));
              }
            }}
            className="w-full p-0 bg-transparent border-0 text-sm text-foreground focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
        <div className="flex items-center divide-x divide-border border-l border-border">
          <button
            type="button"
            onClick={dec}
            disabled={value <= min}
            className="w-10 h-10 inline-flex justify-center items-center text-muted hover:bg-elevated hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Decrease"
          >
            <Minus className="w-3.5 h-3.5 shrink-0" />
          </button>
          <button
            type="button"
            onClick={inc}
            disabled={max !== undefined && value >= max}
            className="w-10 h-10 inline-flex justify-center items-center text-muted hover:bg-elevated hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Increase"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Stepper;
