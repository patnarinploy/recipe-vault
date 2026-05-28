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

// ── Custom Datepicker (calendar popup) ───────────────────────────

const MONTH_FULL  = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
                     "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const MONTH_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const DOW_TH      = ["อา","จ","อ","พ","พฤ","ศ","ส"];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function fmtDisplay(s: string) {
  if (!s) return null;
  const [y, m, d] = s.split("-");
  return `${parseInt(d)} ${MONTH_SHORT[parseInt(m) - 1]} ${y}`;
}

interface DatepickerProps {
  value: string;
  onChange: (v: string) => void;
}

function CustomDatepicker({ value, onChange }: DatepickerProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState("");   // highlighted (pre-confirm) selection
  const [vy, setVy]     = useState(new Date().getFullYear());
  const [vm, setVm]     = useState(new Date().getMonth());   // 0-based

  const wrapRef = useRef<HTMLDivElement>(null);

  function openPicker() {
    if (open) return;
    if (value) {
      const [y, m] = value.split("-").map(Number);
      setVy(y); setVm(m - 1); setTemp(value);
    } else {
      const now = new Date();
      setVy(now.getFullYear()); setVm(now.getMonth()); setTemp("");
    }
    setOpen(true);
  }

  function confirm() { onChange(temp); setOpen(false); }
  function reset()   { onChange(""); setTemp(""); setOpen(false); }

  // Outside click / touch → close without confirming
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  // Escape → close without confirming
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function prevMonth() {
    if (vm === 0) { setVy(y => y - 1); setVm(11); }
    else setVm(m => m - 1);
  }
  function nextMonth() {
    if (vm === 11) { setVy(y => y + 1); setVm(0); }
    else setVm(m => m + 1);
  }

  const firstDow    = new Date(vy, vm, 1).getDay();
  const daysInMonth = new Date(vy, vm + 1, 0).getDate();
  const displayStr  = open ? fmtDisplay(temp) : fmtDisplay(value);

  return (
    <div ref={wrapRef} className="relative w-full">

      {/* ── Trigger row ── */}
      <div className={`flex items-center rounded-xl bg-surface border overflow-hidden transition-colors duration-150
        ${open ? "border-orange-400 ring-1 ring-orange-400" : "border-outline hover:border-orange-300"}`}
      >
        {/* Calendar icon — toggles popup */}
        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => open ? setOpen(false) : openPicker()}
          className="pl-3 pr-2 py-2.5 cursor-pointer text-muted hover:text-orange-500 transition-colors shrink-0"
        >
          <Calendar className="w-4 h-4" />
        </button>

        {/* Date text / placeholder — click to open */}
        <span
          onClick={openPicker}
          className={`flex-1 py-2.5 text-sm min-w-0 truncate cursor-pointer select-none
            ${displayStr ? "text-foreground" : "text-muted"}`}
        >
          {displayStr ?? "เลือกวันที่…"}
        </span>

        {/* X clear — only when value is confirmed and popup is closed */}
        <AnimatePresence>
          {value && !open && (
            <motion.button
              type="button"
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

      {/* ── Calendar popup ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute left-0 right-0 z-50 mt-1.5 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Month / year navigation */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-elevated text-muted hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-foreground select-none">
                {MONTH_FULL[vm]} {vy}
              </span>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-elevated text-muted hover:text-foreground transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 px-3 pt-2.5 pb-1">
              {DOW_TH.map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-muted py-0.5 select-none">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-0.5 px-3 pb-3">
              {Array.from({ length: firstDow }, (_, i) => <div key={`gap${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d        = i + 1;
                const ds       = toDateStr(vy, vm, d);
                const isSel    = ds === temp;
                const isConf   = ds === value;
                const isToday  = ds === today;
                return (
                  <button
                    key={d}
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setTemp(ds)}
                    className={`h-8 w-full rounded-lg text-sm transition-colors
                      ${isSel
                        ? "bg-orange-500 text-white font-semibold"
                        : isConf
                          ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 font-semibold"
                          : isToday
                            ? "text-orange-500 font-medium hover:bg-elevated"
                            : "text-foreground hover:bg-elevated"
                      }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            {/* Footer: Reset + Confirm */}
            <div className="flex gap-2 px-4 py-3 border-t border-border">
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={reset}
                className="flex-1 py-2 text-sm text-secondary border border-border rounded-xl hover:bg-elevated transition-colors"
              >
                รีเซ็ต
              </button>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={confirm}
                disabled={!temp}
                className="flex-1 py-2 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ยืนยัน
              </button>
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
          Datepicker — Custom Calendar Popup
        </h2>

        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <p className="text-xs text-muted">Custom calendar popup พร้อม confirm / reset — ค่าจะไม่เปลี่ยนจนกว่าจะกดยืนยัน</p>

          <CustomDatepicker value={dateVal} onChange={setDateVal} />

          {dateVal && (
            <p className="text-xs text-secondary">
              เลือก: <span className="font-semibold text-foreground">{dateVal}</span>
            </p>
          )}

          <ul className="text-xs text-muted space-y-1 border-t border-border pt-3">
            <li>✓ กด icon ปฏิทิน → เปิด / ปิด (toggle)</li>
            <li>✓ กดวันในปฏิทิน → highlight (preview) ยังไม่บันทึก</li>
            <li>✓ กด ยืนยัน → บันทึกค่า · กด รีเซ็ต → ล้างค่าและปิด</li>
            <li>✓ กดนอก popup → ปิดโดยไม่บันทึก</li>
            <li>✓ ปุ่ม X ล้างค่าที่ยืนยันแล้ว (animate in/out)</li>
            <li>✓ Border + ring เมื่อ popup เปิด (เหมือน Combobox)</li>
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
