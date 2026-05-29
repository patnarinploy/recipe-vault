"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, X } from "lucide-react";

interface DatepickerProps {
  value: string;
  onChange: (v: string) => void;
  name?: string;       // renders hidden input for form submission
  disabled?: boolean;
}

export function Datepicker({ value, onChange, name, disabled = false }: DatepickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  function handleCalendarClick() {
    if (disabled) return;
    if (focused) {
      inputRef.current?.blur();
    } else {
      try {
        (inputRef.current as HTMLInputElement & { showPicker?: () => void })?.showPicker?.();
      } catch { /* fallback */ }
      inputRef.current?.focus();
    }
  }

  return (
    <div className="relative w-full">
      {name && <input type="hidden" name={name} value={value} />}
      <div className={`flex items-center rounded-xl bg-surface border overflow-hidden transition-colors duration-150
        ${disabled
          ? "border-outline opacity-50 cursor-not-allowed"
          : focused
            ? "border-orange-400 ring-1 ring-orange-400"
            : "border-outline hover:border-orange-300"
        }`}
      >
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onMouseDown={e => e.preventDefault()}
          onClick={handleCalendarClick}
          className="pl-3 pr-2 py-2.5 cursor-pointer text-muted hover:text-orange-500 transition-colors shrink-0 disabled:pointer-events-none"
        >
          <Calendar className="w-4 h-4" />
        </button>

        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onClick={() => { try { (inputRef.current as HTMLInputElement & { showPicker?: () => void })?.showPicker?.(); } catch { /* no-op */ } }}
          disabled={disabled}
          className="flex-1 min-w-0 py-2.5 pr-2 text-sm bg-transparent text-foreground cursor-pointer focus:outline-none focus:ring-0 focus:[box-shadow:none] [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden disabled:cursor-not-allowed"
        />

        <AnimatePresence>
          {value && !disabled && (
            <motion.button
              type="button"
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.12 } }}
              exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.1 } }}
              onMouseDown={e => e.preventDefault()}
              onClick={() => onChange("")}
              className="pr-3 pl-1 py-2.5 text-muted hover:text-foreground transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Datepicker;
