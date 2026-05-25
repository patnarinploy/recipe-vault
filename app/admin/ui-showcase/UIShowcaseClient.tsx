"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Check, ChevronDown, Info, Loader2, Plus, Search, X } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";
import Modal from "@/components/Modal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { DropdownContent } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { STORE_COLORS } from "@/components/StoreFormInline";

// ── Section wrapper ────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-bold text-muted uppercase tracking-widest border-b border-border pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ── Code chip ──────────────────────────────────────────────────────

function Code({ children }: { children: string }) {
  return (
    <code className="text-[11px] font-mono bg-elevated border border-border px-1.5 py-0.5 rounded text-muted">
      {children}
    </code>
  );
}

// ── Main ───────────────────────────────────────────────────────────

export default function UIShowcaseClient() {
  // Dialog
  const [alertOpen, setAlertOpen]   = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);

  // Dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Popover
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Switch
  const [switchOn, setSwitchOn] = useState(false);

  // Expand/collapse
  const [expanded, setExpanded] = useState(false);

  // Tab
  const [tab, setTab] = useState("buttons");

  // Color picker
  const [color, setColor] = useState(STORE_COLORS[0]);

  // Loading button
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-10">

      {/* ── 1. Typography ────────────────────────────────────────── */}
      <Section title="Typography">
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-3">
          <h1 className="text-3xl font-bold text-foreground">Heading 1</h1>
          <h2 className="text-2xl font-bold text-foreground">Heading 2</h2>
          <h3 className="text-xl font-semibold text-foreground">Heading 3</h3>
          <p className="text-base text-foreground">Body text — <span className="text-secondary">secondary</span> · <span className="text-muted">muted</span></p>
          <p className="text-sm text-secondary">Small text · <Code>text-sm text-secondary</Code></p>
          <p className="text-xs text-muted">Extra small / caption · <Code>text-xs text-muted</Code></p>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Section Label · <Code>uppercase tracking-widest</Code></p>
        </div>
      </Section>

      {/* ── 2. Buttons ───────────────────────────────────────────── */}
      <Section title="Buttons">
        <div className="bg-surface rounded-2xl border border-border p-5 flex flex-wrap gap-3 items-center">
          {/* Primary */}
          <button className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors">
            Primary
          </button>
          {/* Secondary */}
          <button className="px-4 py-2 rounded-xl bg-elevated border border-border text-sm text-secondary hover:bg-border transition-colors">
            Secondary
          </button>
          {/* Danger */}
          <button className="px-4 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors border border-red-200 dark:border-red-900/30">
            Danger
          </button>
          {/* Ghost */}
          <button className="px-4 py-2 rounded-xl text-sm text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
            Ghost
          </button>
          {/* Icon + label */}
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors">
            <Plus className="w-4 h-4" /> With Icon
          </button>
          {/* Loading */}
          <button
            onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 2000); }}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-60 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {loading ? "Saving…" : "Save (Loading)"}
          </button>
          {/* Disabled */}
          <button disabled className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium opacity-40 cursor-not-allowed">
            Disabled
          </button>
          {/* Icon only */}
          <button className="p-2 rounded-xl bg-elevated border border-border text-muted hover:text-foreground transition-colors">
            <Info className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-xl text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </Section>

      {/* ── 3. Inputs ────────────────────────────────────────────── */}
      <Section title="Form Inputs">
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          {/* Text input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Text Input</label>
            <input
              placeholder="พิมพ์ข้อความ…"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400 placeholder:text-muted"
            />
          </div>
          {/* Search input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Search Input</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
              <input
                placeholder="ค้นหา…"
                className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-xl bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>
          </div>
          {/* Orange-variant (used in forms) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Form Input (orange variant)</label>
            <input
              placeholder="ใช้ใน form แก้ไข…"
              className="w-full border border-orange-300 rounded-xl px-3 py-2 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>
          {/* Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Textarea</label>
            <textarea
              rows={3}
              placeholder="คำอธิบาย…"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none placeholder:text-muted"
            />
          </div>
          {/* Grid 2-col (recipe form style) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">2-Column Grid Input</label>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="ชื่อภาษาไทย"
                className="border border-orange-300 rounded-lg px-3 py-2 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400" />
              <input placeholder="English Name"
                className="border border-orange-300 rounded-lg px-3 py-2 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400" />
            </div>
          </div>
        </div>
      </Section>

      {/* ── 4. Badges & Pills ────────────────────────────────────── */}
      <Section title="Badges & Pills">
        <div className="bg-surface rounded-2xl border border-border p-5 flex flex-wrap gap-2 items-center">
          <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium">Orange</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 font-medium">Success</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/20 text-rose-600 font-medium">Danger</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-900/20 text-sky-600 font-medium">Info</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/20 text-violet-600 font-medium">Violet</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-elevated border border-border text-muted font-medium">Neutral</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">NEW</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/20 text-muted font-medium">ซ่อน</span>
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-elevated border border-border text-foreground">
            <span className="w-2 h-2 rounded-full bg-orange-500" />Store Chip
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md font-semibold border text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/40 inline-flex items-center gap-1">
            <Check className="w-3 h-3" /> Build Badge
          </span>
        </div>
      </Section>

      {/* ── 5. Switch ────────────────────────────────────────────── */}
      <Section title="Switch">
        <div className="bg-surface rounded-2xl border border-border p-5 flex items-center gap-4">
          <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
          <span className="text-sm text-secondary">{switchOn ? "เปิด" : "ปิด"}</span>
          <Code>{"<Switch checked={...} onCheckedChange={...} />"}</Code>
        </div>
      </Section>

      {/* ── 6. Tabs ──────────────────────────────────────────────── */}
      <Section title="Tabs">
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          {/* Border-bottom style (used in Library / Shopping) */}
          <div>
            <p className="text-xs text-muted mb-2">Border-bottom style</p>
            <div className="flex gap-1 border-b border-border">
              {["หน้าแรก", "สูตรอาหาร", "ร้านค้า"].map(l => (
                <button key={l} onClick={() => setTab(l)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${tab === l ? "text-orange-500" : "text-muted hover:text-foreground"}`}>
                  {l}
                  {tab === l && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />}
                </button>
              ))}
            </div>
          </div>
          {/* Tabs component */}
          <div>
            <p className="text-xs text-muted mb-2">Tabs component</p>
            <Tabs value="a">
              <TabsList>
                <TabsTrigger value="a">Tab A</TabsTrigger>
                <TabsTrigger value="b">Tab B</TabsTrigger>
                <TabsTrigger value="c">Tab C</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </Section>

      {/* ── 7. Color Palette ─────────────────────────────────────── */}
      <Section title="Color Palette (STORE_COLORS)">
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {STORE_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full transition-transform hover:scale-110 shrink-0"
                style={{ background: c, outline: color === c ? `3px solid ${c}` : "2px solid transparent", outlineOffset: 2 }} />
            ))}
          </div>
          <p className="text-xs text-muted">เลือก: <span className="font-mono font-semibold" style={{ color }}>{color}</span></p>
        </div>
      </Section>

      {/* ── 8. Skeleton / Loading ────────────────────────────────── */}
      <Section title="Skeleton / Loading">
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-48 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="space-y-1.5">
                <div className="skeleton h-5 w-8 rounded mx-auto" />
                <div className="skeleton h-2.5 w-14 rounded mx-auto" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map(i => <div key={i} className="skeleton w-9 h-9 rounded-full" />)}
          </div>
          <div className="skeleton h-3 w-20 rounded inline-block" />
          <p className="text-xs text-muted"><Code>className="skeleton ..."</Code></p>
        </div>
      </Section>

      {/* ── 9. Expand / Collapse ─────────────────────────────────── */}
      <Section title="Expand / Collapse Animation">
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-elevated/50 transition-colors"
          >
            <span>กดเพื่อ{expanded ? "ปิด" : "เปิด"}</span>
            <ChevronDown className={`w-4 h-4 text-muted transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
                exit={{ height: 0, opacity: 0, transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } }}
                style={{ overflow: "hidden" }}
              >
                <div className="px-5 pb-5 pt-2 border-t border-border bg-orange-50/40 dark:bg-orange-900/10 space-y-2">
                  <p className="text-sm text-secondary">เนื้อหาด้านในที่ expand ออกมา (600ms / 300ms)</p>
                  <p className="text-xs text-muted">ใช้ <Code>AnimatePresence</Code> + <Code>motion.div</Code> + height: auto</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Section>

      {/* ── 10. Dropdown ─────────────────────────────────────────── */}
      <Section title="Dropdown Menu">
        <div className="bg-surface rounded-2xl border border-border p-5">
          <div className="relative inline-block">
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-elevated border border-border text-sm text-secondary hover:bg-border transition-colors"
            >
              ตัวเลือก <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            <DropdownContent open={dropdownOpen} origin="top left" className="absolute left-0 top-full mt-2 w-44 z-50">
              {["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3"].map(l => (
                <button key={l} onClick={() => { toast.success(l); setDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-secondary hover:bg-elevated transition-colors">
                  {l}
                </button>
              ))}
              <div className="border-t border-border mt-1 pt-1">
                <button onClick={() => setDropdownOpen(false)}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                  ยกเลิก
                </button>
              </div>
            </DropdownContent>
          </div>
          <p className="text-xs text-muted mt-3"><Code>{"<DropdownContent open={...} origin='top left'>"}</Code></p>
        </div>
      </Section>

      {/* ── 11. Popover ──────────────────────────────────────────── */}
      <Section title="Popover">
        <div className="bg-surface rounded-2xl border border-border p-5 flex items-center gap-4 flex-wrap">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-elevated border border-border text-sm text-secondary hover:bg-border transition-colors">
                <Info className="w-4 h-4 text-muted" /> Popover
              </button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start" sideOffset={8} className="w-56">
              <p className="text-sm font-semibold text-foreground mb-1">Popover Content</p>
              <p className="text-xs text-muted">ใช้สำหรับข้อมูลเสริมหรือ mini panel ที่ไม่ต้องการ modal เต็มหน้าจอ</p>
            </PopoverContent>
          </Popover>
          <Code>{"<Popover> <PopoverTrigger> <PopoverContent>"}</Code>
        </div>
      </Section>

      {/* ── 12. Toast ────────────────────────────────────────────── */}
      <Section title="Toast Notifications">
        <div className="bg-surface rounded-2xl border border-border p-5 flex flex-wrap gap-2">
          <button onClick={() => toast.success("บันทึกสำเร็จ")}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors">
            Success
          </button>
          <button onClick={() => toast.error("เกิดข้อผิดพลาด")}
            className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors">
            Error
          </button>
          <button onClick={() => toast("ข้อความทั่วไป")}
            className="px-4 py-2 rounded-xl bg-elevated border border-border text-sm text-secondary hover:bg-border transition-colors">
            Default
          </button>
          <button onClick={() => toast.loading("กำลังโหลด…")}
            className="px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors">
            Loading
          </button>
          <p className="w-full text-xs text-muted"><Code>toast.success / toast.error / toast.loading</Code> via <Code>sonner</Code></p>
        </div>
      </Section>

      {/* ── 13. Alert Dialog ─────────────────────────────────────── */}
      <Section title="Alert Dialog (Confirm)">
        <div className="bg-surface rounded-2xl border border-border p-5 flex items-center gap-4 flex-wrap">
          <button onClick={() => setAlertOpen(true)}
            className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/30 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
            เปิด Confirm Dialog
          </button>
          <Code>{"<AlertDialog danger confirmLabel='ลบ' cancelLabel='ยกเลิก'>"}</Code>
          <AlertDialog
            open={alertOpen}
            onOpenChange={setAlertOpen}
            title="ยืนยันการลบ?"
            description="การกระทำนี้ไม่สามารถย้อนกลับได้"
            danger
            confirmLabel="ลบ"
            cancelLabel="ยกเลิก"
            onConfirm={() => toast.success("ลบแล้ว")}
          />
        </div>
      </Section>

      {/* ── 14. Modal ────────────────────────────────────────────── */}
      <Section title="Modal">
        <div className="bg-surface rounded-2xl border border-border p-5 flex items-center gap-4 flex-wrap">
          <button onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors">
            เปิด Modal
          </button>
          <Code>{"<Modal open={...} onClose={...} title='...'>"}</Code>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="ตัวอย่าง Modal">
            <div className="bg-surface rounded-b-2xl border border-border border-t-0 p-6 space-y-3">
              <p className="text-sm text-secondary">นี่คือ modal dialog มาตรฐาน มี backdrop blur, spring animation, และปิดได้ด้วย ESC หรือกดนอก panel</p>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm text-muted bg-elevated hover:bg-border transition-colors">
                  ปิด
                </button>
                <button onClick={() => { setModalOpen(false); toast.success("กดยืนยัน"); }}
                  className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors">
                  ยืนยัน
                </button>
              </div>
            </div>
          </Modal>
        </div>
      </Section>

      {/* ── 15. Cards / Surfaces ─────────────────────────────────── */}
      <Section title="Cards & Surfaces">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">surface</p>
            <p className="text-sm text-secondary">bg-surface · border-border · rounded-2xl · shadow-sm</p>
          </div>
          <div className="bg-elevated rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">elevated</p>
            <p className="text-sm text-secondary">bg-elevated — row headers, input backgrounds</p>
          </div>
          <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-200 dark:border-orange-900/30 p-4">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">form card</p>
            <p className="text-sm text-secondary">bg-orange-50/50 — ใช้ใน add/edit forms</p>
          </div>
        </div>
      </Section>

    </div>
  );
}
