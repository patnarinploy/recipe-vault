"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Loader2, X } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { SelectCustom } from "@/components/ui/select-custom";

const COMBO_OPTIONS = ["กระเทียม", "หัวหอม", "พริกขี้หนู", "ขิง", "ตะไคร้", "ใบมะกรูด", "น้ำปลา", "ซีอิ๊ว"];

const CATEGORY_OPTIONS = [
  { value: "thai",     label: "อาหารไทย" },
  { value: "chinese",  label: "อาหารจีน" },
  { value: "japanese", label: "อาหารญี่ปุ่น" },
  { value: "western",  label: "อาหารฝรั่ง" },
  { value: "dessert",  label: "ขนมหวาน" },
];

const UNIT_OPTIONS = [
  { value: "g",    label: "กรัม (g)" },
  { value: "kg",   label: "กิโลกรัม (kg)" },
  { value: "ml",   label: "มิลลิลิตร (ml)" },
  { value: "l",    label: "ลิตร (l)" },
  { value: "cup",  label: "ถ้วย (cup)" },
  { value: "tbsp", label: "ช้อนโต๊ะ (tbsp)" },
  { value: "tsp",  label: "ช้อนชา (tsp)" },
];

// ── Custom Datepicker wrapper (native <input type="date">) ────────────────

interface DatepickerProps {
  value: string;
  onChange: (v: string) => void;
}

function CustomDatepicker({ value, onChange }: DatepickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  // localValue drives the controlled input during picking.
  // External value only updates on blur (✓ tapped) or explicit reset/clear.
  const [localValue, setLocalValue] = useState(value);

  // Sync when external value changes while picker is closed (e.g. X button)
  useEffect(() => {
    if (!focused) setLocalValue(value);
  }, [value, focused]);

  function handleCalendarClick() {
    if (focused) {
      inputRef.current?.blur();
    } else {
      try {
        (inputRef.current as HTMLInputElement & { showPicker?: () => void })?.showPicker?.();
      } catch { /* fallback */ }
      inputRef.current?.focus();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setLocalValue(v);
    // รีเซ็ต button fires change with "" → propagate immediately so value clears
    if (!v) onChange("");
  }

  function handleBlur() {
    setFocused(false);
    // Picker closed (✓ tapped, or date clicked on desktop) → confirm the value
    onChange(localValue);
  }

  function handleClear() {
    setLocalValue("");
    onChange("");
  }

  return (
    <div className="relative w-full">
      <div className={`flex items-center rounded-xl bg-surface border overflow-hidden transition-colors duration-150
        ${focused
          ? "border-orange-400 ring-1 ring-orange-400"
          : "border-outline hover:border-orange-300"
        }`}
      >
        {/* Calendar icon — toggles picker */}
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={e => e.preventDefault()}
          onClick={handleCalendarClick}
          className="pl-3 pr-2 py-2.5 cursor-pointer text-muted hover:text-orange-500 transition-colors shrink-0"
        >
          <Calendar className="w-4 h-4" />
        </button>

        {/* Native date input — localValue prevents intermediate taps from propagating */}
        <input
          ref={inputRef}
          type="date"
          value={localValue}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          className="flex-1 min-w-0 py-2.5 pr-2 text-sm bg-transparent text-foreground cursor-pointer focus:outline-none focus:ring-0 focus:[box-shadow:none] [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden"
        />

        {/* X clear button — show based on confirmed external value */}
        <AnimatePresence>
          {value && (
            <motion.button
              type="button"
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.12 } }}
              exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.1 } }}
              onMouseDown={e => e.preventDefault()}
              onClick={handleClear}
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

// ── Main ──────────────────────────────────────────────────────────

export default function SandboxClient() {
  const [comboVal,      setComboVal]      = useState("");
  const [comboLoading,  setComboLoading]  = useState(false);
  const [selectCat,     setSelectCat]     = useState("");
  const [selectUnit,    setSelectUnit]    = useState("");
  const [selectLoading, setSelectLoading] = useState(false);
  const [dateVal,       setDateVal]       = useState("");

  function simulateLoad(setter: (v: boolean) => void) {
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  return (
    <div className="space-y-8">

      {/* ── Datepicker ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-muted uppercase tracking-widest border-b border-border pb-2">
          Datepicker — Custom Wrapper
        </h2>

        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <p className="text-xs text-muted">Native browser datepicker — ใช้ OS sheet บนมือถือ, calendar dropdown บน desktop</p>

          <CustomDatepicker value={dateVal} onChange={setDateVal} />

          {dateVal && (
            <p className="text-xs text-secondary">
              เลือก: <span className="font-semibold text-foreground">{dateVal}</span>
            </p>
          )}

          <ul className="text-xs text-muted space-y-1 border-t border-border pt-3">
            <li>✓ กด icon ปฏิทิน → เปิด / ปิด (toggle)</li>
            <li>✓ กดวันระหว่าง picking → ยังไม่บันทึก (ค่าจริงรอกด ✓)</li>
            <li>✓ กด ✓ ยืนยัน → บันทึกค่า · กด รีเซ็ต → ล้างค่าทันที</li>
            <li>✓ ปุ่ม X ล้างค่าที่ยืนยันแล้ว (animate in/out)</li>
            <li>✓ Border + ring เมื่อ focus (เหมือน Combobox)</li>
            <li>✓ บนมือถือ → ใช้ native OS date picker ของ browser</li>
          </ul>
        </div>
      </section>

      {/* ── Combobox ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-muted uppercase tracking-widest border-b border-border pb-2">
          Combobox — Searchable + Creatable
        </h2>

        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">ค้นหา / พิมพ์สร้างใหม่ได้</p>
            <button
              onClick={() => simulateLoad(setComboLoading)}
              disabled={comboLoading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-elevated border border-border text-secondary hover:bg-border transition-colors disabled:opacity-50"
            >
              {comboLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              {comboLoading ? "กำลังโหลด…" : "จำลอง Loading (2s)"}
            </button>
          </div>

          <Combobox
            value={comboVal}
            onChange={setComboVal}
            options={COMBO_OPTIONS}
            placeholder="ค้นหาหรือพิมพ์เพิ่มเอง…"
            loading={comboLoading}
          />

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

      {/* ── Custom Select ──────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-muted uppercase tracking-widest border-b border-border pb-2">
          Dropdown List — Custom Select
        </h2>

        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">เลือกจากรายการที่กำหนด</p>
            <button
              onClick={() => simulateLoad(setSelectLoading)}
              disabled={selectLoading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-elevated border border-border text-secondary hover:bg-border transition-colors disabled:opacity-50"
            >
              {selectLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              {selectLoading ? "กำลังโหลด…" : "จำลอง Loading (2s)"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">หมวดหมู่อาหาร</label>
              <SelectCustom
                value={selectCat}
                onChange={setSelectCat}
                options={CATEGORY_OPTIONS}
                placeholder="-- เลือกหมวดหมู่ --"
                loading={selectLoading}
                clearable
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">หน่วยวัด</label>
              <SelectCustom
                value={selectUnit}
                onChange={setSelectUnit}
                options={UNIT_OPTIONS}
                placeholder="-- เลือกหน่วย --"
                loading={selectLoading}
                clearable
              />
            </div>
          </div>

          {(selectCat || selectUnit) && (
            <p className="text-xs text-secondary">
              เลือก:{" "}
              {selectCat  && <span className="font-semibold text-foreground mr-2">{CATEGORY_OPTIONS.find(o => o.value === selectCat)?.label}</span>}
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
