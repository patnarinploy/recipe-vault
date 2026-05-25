"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, X, Loader2, Check } from "lucide-react";

type Option = { value: string; label: string } | string;

function optValue(o: Option) { return typeof o === "string" ? o : o.value; }
function optLabel(o: Option) { return typeof o === "string" ? o : o.label; }

interface SelectCustomProps {
  value?: string;
  onChange?: (v: string) => void;
  name?: string;
  defaultValue?: string;
  options: Option[];
  placeholder?: string;
  loading?: boolean;
  wrapperClass?: string;
  clearable?: boolean;
}

export function SelectCustom({
  value: valueProp,
  onChange,
  name,
  defaultValue = "",
  options,
  placeholder = "-- เลือก --",
  loading = false,
  wrapperClass = "",
  clearable = false,
}: SelectCustomProps) {
  const isControlled = valueProp !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = isControlled ? valueProp : internalValue;

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => optValue(o) === value);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function select(v: string) {
    if (!isControlled) setInternalValue(v);
    onChange?.(v);
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isControlled) setInternalValue("");
    onChange?.("");
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className={`relative w-full min-w-0 ${wrapperClass}`}>
      {name && <input type="hidden" name={name} value={value} />}

      <button
        type="button"
        disabled={loading}
        onClick={() => !loading && setOpen(o => !o)}
        className={`w-full flex items-center gap-2 border rounded-xl px-3 py-2.5 text-sm bg-surface text-left transition-colors
          ${loading
            ? "border-border opacity-60 cursor-not-allowed"
            : open
              ? "border-orange-400 ring-2 ring-orange-400/20 focus:outline-none"
              : "border-outline hover:border-orange-300 focus:outline-none"}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 text-muted animate-spin shrink-0" />
            <span className="flex-1 min-w-0 truncate text-muted text-sm">กำลังโหลด…</span>
          </>
        ) : (
          <span className={`flex-1 min-w-0 truncate ${selected ? "text-foreground" : "text-muted"}`}>
            {selected ? optLabel(selected) : placeholder}
          </span>
        )}

        <div className="flex items-center gap-0.5 shrink-0">
          {!loading && clearable && value && (
            <span
              role="button"
              onClick={clear}
              className="p-1 rounded text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <ChevronDown className="w-4 h-4 text-muted" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {open && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.1, ease: [0.4, 0, 1, 1] } }}
            style={{ transformOrigin: "top", maxHeight: "14rem" }}
            className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg overflow-y-auto"
          >
            {options.map(opt => {
              const v = optValue(opt);
              const l = optLabel(opt);
              return (
                <button key={v} type="button" onClick={() => select(v)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors
                    ${v === value
                      ? "text-orange-600 dark:text-orange-400 font-semibold bg-orange-50/50 dark:bg-orange-950/20"
                      : "text-secondary hover:text-orange-600 dark:hover:text-orange-400"}`}
                >
                  <span className="flex-1 text-left">{l}</span>
                  {v === value && <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SelectCustom;
