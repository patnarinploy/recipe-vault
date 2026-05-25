"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
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

// ── Custom Datepicker ─────────────────────────────────────────────

const MONTHS_TH       = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const MONTHS_TH_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const DAYS_TH         = ["อา","จ","อ","พ","พฤ","ศ","ส"];

function formatDateTH(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${MONTHS_TH_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`;
}

interface DatepickerProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

function CustomDatepicker({ value, onChange, placeholder = "เลือกวันที่" }: DatepickerProps) {
  const today = new Date();
  const [open, setOpen]         = useState(false);
  const [viewYear, setViewYear] = useState(() => value ? new Date(value + "T00:00:00").getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value + "T00:00:00").getMonth() : today.getMonth());
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Snap calendar view to selected date when opening
  useEffect(() => {
    if (open && value) {
      const d = new Date(value + "T00:00:00");
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [open, value]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function selectDay(day: number) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <div
        role="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 bg-surface cursor-pointer transition-colors
          ${open ? "border-orange-400 ring-2 ring-orange-400/20" : "border-outline hover:border-orange-300"}`}
      >
        <Calendar className="w-4 h-4 text-muted shrink-0" />
        <span className={`flex-1 min-w-0 text-sm select-none ${value ? "text-foreground" : "text-muted"}`}>
          {value ? formatDateTH(value) : placeholder}
        </span>
        {value && (
          <span
            role="button"
            onClick={e => { e.stopPropagation(); onChange(""); }}
            className="p-1 rounded text-muted hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.1, ease: [0.4, 0, 1, 1] } }}
            style={{ transformOrigin: "top" }}
            className="absolute z-50 top-full left-0 mt-1 bg-surface border border-border rounded-xl shadow-lg p-3 w-full min-w-[17rem]"
          >
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-2 px-1">
              <button type="button" onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-elevated transition-colors text-muted hover:text-foreground">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-foreground">
                {MONTHS_TH[viewMonth]} {viewYear + 543}
              </span>
              <button type="button" onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-elevated transition-colors text-muted hover:text-foreground">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS_TH.map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-muted py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((day, idx) => {
                if (!day) return <div key={idx} />;
                const mm  = String(viewMonth + 1).padStart(2, "0");
                const dd  = String(day).padStart(2, "0");
                const iso = `${viewYear}-${mm}-${dd}`;
                const isSelected = value === iso;
                const isToday    = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
                return (
                  <button key={idx} type="button" onClick={() => selectDay(day)}
                    className={`text-center text-sm py-1.5 rounded-lg transition-colors
                      ${isSelected
                        ? "bg-orange-500 text-white font-semibold"
                        : isToday
                          ? "text-orange-500 font-semibold hover:bg-orange-50 dark:hover:bg-orange-950/20"
                          : "text-foreground hover:bg-elevated"}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
          Datepicker — Custom Calendar
        </h2>

        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <p className="text-xs text-muted">เลือกวันที่ด้วย Calendar Dropdown</p>

          <CustomDatepicker value={dateVal} onChange={setDateVal} />

          {dateVal && (
            <p className="text-xs text-secondary">
              เลือก: <span className="font-semibold text-foreground">{dateVal}</span>
            </p>
          )}

          <ul className="text-xs text-muted space-y-1 border-t border-border pt-3">
            <li>✓ กด Calendar icon หรือพื้นที่ input เพื่อ toggle เปิด/ปิด</li>
            <li>✓ กด X เพื่อล้างค่า</li>
            <li>✓ เปิด/ปิดมี Animation (scale + fade)</li>
            <li>✓ นำทางเดือนก่อน/หลัง · วันที่เลือกไฮไลท์สีส้ม · วันนี้ตัวอักษรสีส้ม</li>
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
