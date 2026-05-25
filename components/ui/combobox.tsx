"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, X, Loader2 } from "lucide-react";
import { useLocale } from "@/lib/locale";

interface ComboboxProps {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
  loading?: boolean;
  wrapperClass?: string;
  createLabel?: string;
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder = "",
  loading = false,
  wrapperClass = "",
  createLabel,
}: ComboboxProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addLabel = createLabel ?? t.recipe.createOption;

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        onChange(query.trim());
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, query, onChange]);

  const filtered   = options.filter(u => !query || u.toLowerCase().includes(query.toLowerCase()));
  const showCreate = query.trim() !== "" && !options.some(u => u.toLowerCase() === query.trim().toLowerCase());

  function select(v: string) { onChange(v); setQuery(v); setOpen(false); }
  function clear()           { onChange(""); setQuery(""); inputRef.current?.focus(); }

  function toggleOpen() {
    if (loading) return;
    if (open) { setOpen(false); } else { setOpen(true); inputRef.current?.focus(); }
  }

  return (
    <div ref={wrapRef} className={`relative w-full min-w-0 ${wrapperClass}`}>
      <div
        className={`flex items-center border rounded-xl bg-surface transition-colors
          ${loading
            ? "border-border opacity-60 cursor-not-allowed"
            : open
              ? "border-orange-400 ring-1 ring-orange-400"
              : "border-outline hover:border-orange-300"}`}
      >
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-2.5 flex-1 min-w-0">
            <Loader2 className="w-4 h-4 text-muted animate-spin shrink-0" />
            <span className="flex-1 min-w-0 truncate text-sm text-muted">กำลังโหลด…</span>
          </div>
        ) : (
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={e => {
              if (e.key === "Escape") { onChange(query.trim()); setOpen(false); }
              if (e.key === "Enter") { e.preventDefault(); select(query.trim()); }
            }}
            placeholder={placeholder}
            className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-transparent text-foreground focus:outline-none focus:[box-shadow:none] placeholder:text-muted"
          />
        )}

        <div className="flex items-center gap-0.5 pr-2 shrink-0">
          {!loading && value && (
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={clear}
              className="p-1 rounded text-muted hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            disabled={loading}
            onMouseDown={e => e.preventDefault()}
            onClick={toggleOpen}
            className="p-1 rounded text-muted hover:text-foreground transition-colors disabled:opacity-40"
          >
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && !loading && (filtered.length > 0 || showCreate) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.1, ease: [0.4, 0, 1, 1] } }}
            style={{ transformOrigin: "top", maxHeight: "12rem" }}
            className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg overflow-y-auto"
          >
            {filtered.map(u => (
              <button key={u} type="button" onClick={() => select(u)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-600 dark:hover:text-orange-400 transition-colors
                  ${u === value ? "font-semibold text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20" : "text-secondary"}`}>
                {u}
              </button>
            ))}
            {showCreate && (
              <button type="button" onClick={() => select(query.trim())}
                className="w-full text-left px-3 py-2 text-sm text-orange-600 dark:text-orange-400 font-medium hover:bg-orange-50 dark:hover:bg-orange-950/20 border-t border-border transition-colors">
                {addLabel} &ldquo;{query.trim()}&rdquo;
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Combobox;
