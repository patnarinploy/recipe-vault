"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, X, Loader2, Check } from "lucide-react";

// ── Improved Combobox ─────────────────────────────────────────────
// Changes vs original:
//  1. X clear button inside input when value is selected
//  2. Arrow animates up when open
//  3. Loading state — spinner shown, interaction disabled
//  4. Arrow button toggles open/close (doesn't type)

const COMBO_OPTIONS = ["กระเทียม", "หัวหอม", "พริกขี้หนู", "ขิง", "ตะไคร้", "ใบมะกรูด", "น้ำปลา", "ซีอิ๊ว"];

function ImprovedCombobox({ value, onChange, loading = false }: {
  value: string;
  onChange: (v: string) => void;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        onChange(query.trim()); setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, query, onChange]);

  const filtered   = COMBO_OPTIONS.filter(u => !query || u.toLowerCase().includes(query.toLowerCase()));
  const showCreate = query.trim() !== "" && !COMBO_OPTIONS.some(u => u.toLowerCase() === query.trim().toLowerCase());

  function select(v: string) { onChange(v); setQuery(v); setOpen(false); }
  function clear()           { onChange(""); setQuery(""); inputRef.current?.focus(); }

  function toggleOpen() {
    if (loading) return;
    if (open) {
      setOpen(false);
    } else {
      setOpen(true);
      inputRef.current?.focus();
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className={`flex items-center border rounded-xl bg-surface transition-colors
        ${loading
          ? "border-border opacity-60 cursor-not-allowed"
          : open
            ? "border-orange-400 ring-1 ring-orange-400"
            : "border-border hover:border-orange-300"}`}
      >
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-2 flex-1">
            <Loader2 className="w-4 h-4 text-muted animate-spin shrink-0" />
            <span className="text-sm text-muted">กำลังโหลด…</span>
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
            placeholder="ค้นหาหรือพิมพ์เพิ่มเอง…"
            className="flex-1 min-w-0 px-3 py-2 text-sm bg-transparent text-foreground focus:outline-none placeholder:text-muted"
          />
        )}

        <div className="flex items-center gap-0.5 pr-2 shrink-0">
          {/* X clear button — shows when value selected */}
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
          {/* Arrow — toggles open/close */}
          <button
            type="button"
            disabled={loading}
            onMouseDown={e => e.preventDefault()}
            onClick={toggleOpen}
            className="p-1 rounded text-muted hover:text-foreground transition-colors disabled:opacity-40"
          >
            <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
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
                className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-600 transition-colors
                  ${u === value ? "font-semibold text-orange-600 bg-orange-50/50 dark:bg-orange-950/20" : "text-secondary"}`}>
                {u}
              </button>
            ))}
            {showCreate && (
              <button type="button" onClick={() => select(query.trim())}
                className="w-full text-left px-3 py-2 text-sm text-orange-600 font-medium hover:bg-orange-50 dark:hover:bg-orange-950/20 border-t border-border transition-colors">
                เพิ่ม &ldquo;{query.trim()}&rdquo;
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Improved Select (custom — replaces native <select>) ───────────
// Changes vs original:
//  1. Open/close animation (AnimatePresence + motion.div)
//  2. X clear button inside trigger when value selected
//  3. Arrow animates up when open
//  4. Loading state — spinner shown, interaction disabled

type SelectOption = { value: string; label: string };

function ImprovedSelect({ value, onChange, options, placeholder = "-- เลือก --", loading = false }: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function clear(e: React.MouseEvent) { e.stopPropagation(); onChange(""); setOpen(false); }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={loading}
        onClick={() => !loading && setOpen(o => !o)}
        className={`w-full flex items-center gap-2 border rounded-xl px-3 py-2.5 text-sm bg-surface text-left transition-colors
          ${loading
            ? "border-border opacity-60 cursor-not-allowed"
            : open
              ? "border-orange-400 ring-1 ring-orange-400"
              : "border-border hover:border-orange-300 focus:outline-none"}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 text-muted animate-spin shrink-0" />
            <span className="flex-1 text-muted text-sm">กำลังโหลด…</span>
          </>
        ) : (
          <span className={`flex-1 truncate ${selected ? "text-foreground" : "text-muted"}`}>
            {selected ? selected.label : placeholder}
          </span>
        )}

        <div className="flex items-center gap-0.5 shrink-0">
          {/* X clear button */}
          {!loading && value && (
            <span
              role="button"
              onClick={clear}
              className="p-1 rounded text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          {/* Animated arrow */}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
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
            {options.map(opt => (
              <button key={opt.value} type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors
                  ${opt.value === value ? "text-orange-600 font-semibold bg-orange-50/50 dark:bg-orange-950/20" : "text-secondary hover:text-orange-600"}`}>
                <span className="flex-1 text-left">{opt.label}</span>
                {opt.value === value && <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: "thai",     label: "อาหารไทย" },
  { value: "chinese",  label: "อาหารจีน" },
  { value: "japanese", label: "อาหารญี่ปุ่น" },
  { value: "western",  label: "อาหารฝรั่ง" },
  { value: "dessert",  label: "ขนมหวาน" },
];

const UNIT_OPTIONS: SelectOption[] = [
  { value: "g",   label: "กรัม (g)" },
  { value: "kg",  label: "กิโลกรัม (kg)" },
  { value: "ml",  label: "มิลลิลิตร (ml)" },
  { value: "l",   label: "ลิตร (l)" },
  { value: "cup", label: "ถ้วย (cup)" },
  { value: "tbsp",label: "ช้อนโต๊ะ (tbsp)" },
  { value: "tsp", label: "ช้อนชา (tsp)" },
];

// ── Main ──────────────────────────────────────────────────────────

export default function SandboxClient() {
  // Combobox
  const [comboVal,      setComboVal]      = useState("");
  const [comboLoading,  setComboLoading]  = useState(false);

  // Select
  const [selectCat,     setSelectCat]     = useState("");
  const [selectUnit,    setSelectUnit]    = useState("");
  const [selectLoading, setSelectLoading] = useState(false);

  function simulateLoad(setter: (v: boolean) => void) {
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  return (
    <div className="space-y-8">

      {/* ── Combobox (Improved) ───────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-muted uppercase tracking-widest border-b border-border pb-2">
          Combobox — Searchable + Creatable (ปรับปรุงแล้ว)
        </h2>

        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">ค้นหา / พิมพ์สร้างใหม่ได้</p>
            <button
              onClick={() => simulateLoad(setComboLoading)}
              disabled={comboLoading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-elevated border border-border text-secondary hover:bg-border transition-colors disabled:opacity-50"
            >
              {comboLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {comboLoading ? "กำลังโหลด…" : "จำลอง Loading (2s)"}
            </button>
          </div>

          <ImprovedCombobox value={comboVal} onChange={setComboVal} loading={comboLoading} />

          {comboVal && (
            <p className="text-xs text-secondary">
              เลือก: <span className="font-semibold text-foreground">{comboVal}</span>
            </p>
          )}

          <ul className="text-xs text-muted space-y-1 border-t border-border pt-3">
            <li>✓ กด X เพื่อล้างค่า</li>
            <li>✓ ลูกศรขวาสุดกด = เปิด/ปิด (ไม่ขึ้น keyboard)</li>
            <li>✓ ลูกศรหมุน 180° เมื่อ Dropdown เปิด</li>
            <li>✓ Loading state = spinner + กดไม่ได้</li>
          </ul>
        </div>
      </section>

      {/* ── Dropdown List (Improved) ──────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-muted uppercase tracking-widest border-b border-border pb-2">
          Dropdown List — Custom Select (ปรับปรุงแล้ว)
        </h2>

        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">เลือกจากรายการที่กำหนด</p>
            <button
              onClick={() => simulateLoad(setSelectLoading)}
              disabled={selectLoading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-elevated border border-border text-secondary hover:bg-border transition-colors disabled:opacity-50"
            >
              {selectLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {selectLoading ? "กำลังโหลด…" : "จำลอง Loading (2s)"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">หมวดหมู่อาหาร</label>
              <ImprovedSelect
                value={selectCat}
                onChange={setSelectCat}
                options={CATEGORY_OPTIONS}
                placeholder="-- เลือกหมวดหมู่ --"
                loading={selectLoading}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">หน่วยวัด</label>
              <ImprovedSelect
                value={selectUnit}
                onChange={setSelectUnit}
                options={UNIT_OPTIONS}
                placeholder="-- เลือกหน่วย --"
                loading={selectLoading}
              />
            </div>
          </div>

          {(selectCat || selectUnit) && (
            <p className="text-xs text-secondary">
              เลือก:{" "}
              {selectCat && <span className="font-semibold text-foreground mr-2">{CATEGORY_OPTIONS.find(o => o.value === selectCat)?.label}</span>}
              {selectUnit && <span className="font-semibold text-foreground">{UNIT_OPTIONS.find(o => o.value === selectUnit)?.label}</span>}
            </p>
          )}

          <ul className="text-xs text-muted space-y-1 border-t border-border pt-3">
            <li>✓ เปิด/ปิดมี Animation (scale + fade)</li>
            <li>✓ กด X เพื่อล้างค่า</li>
            <li>✓ ลูกศรหมุน 180° เมื่อ Dropdown เปิด</li>
            <li>✓ Loading state = spinner + กดไม่ได้</li>
            <li>✓ รายการที่เลือกมี ✓ Checkmark</li>
          </ul>
        </div>
      </section>

    </div>
  );
}
