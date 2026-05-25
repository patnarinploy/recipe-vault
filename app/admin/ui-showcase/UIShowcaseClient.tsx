"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Check, ChevronDown, Info, Loader2, Plus, Search, X, FlaskConical } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";
import Modal from "@/components/Modal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { DropdownContent } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { STORE_COLORS } from "@/components/StoreFormInline";

// ── Showcase Combobox (searchable + creatable, mirrors RecipeForm) ──

const COMBO_OPTIONS = ["กระเทียม", "หัวหอม", "พริกขี้หนู", "ขิง", "ตะไคร้", "ใบมะกรูด", "น้ำปลา", "ซีอิ๊ว"];

function ShowcaseCombobox({ value, onChange, className = "" }: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  const filtered = COMBO_OPTIONS.filter(u => !query || u.toLowerCase().includes(query.toLowerCase()));
  const showCreate = query.trim() !== "" && !COMBO_OPTIONS.some(u => u.toLowerCase() === query.trim().toLowerCase());
  function select(v: string) { onChange(v); setQuery(v); setOpen(false); }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (e.key === "Escape") { onChange(query.trim()); setOpen(false); }
          if (e.key === "Enter") { e.preventDefault(); select(query.trim()); }
        }}
        placeholder="ค้นหาหรือพิมพ์เพิ่มเอง…"
        style={{ paddingRight: "2rem" }}
        className="w-full border border-orange-300 rounded-xl px-3 py-2 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
        <ChevronDown className="w-4 h-4" />
      </div>
      <AnimatePresence>
        {open && (filtered.length > 0 || showCreate) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.1, ease: [0.4, 0, 1, 1] } }}
            style={{ transformOrigin: "top", maxHeight: "12rem" }}
            className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-outline rounded-xl shadow-lg overflow-y-auto"
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
                เพิ่ม &ldquo;{query.trim()}&rdquo;
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Achievement badge colors ────────────────────────────────────────

const TIER_BG: Record<string, string> = {
  1: "bg-stone-200/80 dark:bg-stone-600/60",
  2: "bg-sky-200/80 dark:bg-sky-700/60",
  3: "bg-emerald-200/80 dark:bg-emerald-700/60",
  4: "bg-violet-200/80 dark:bg-violet-700/60",
  5: "bg-amber-200/80 dark:bg-amber-600/60",
  special: "bg-rose-200/80 dark:bg-rose-700/60",
};
const TIER_PILL: Record<string, string> = {
  1: "bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-300",
  2: "bg-sky-50 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300",
  3: "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300",
  4: "bg-violet-50 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300",
  5: "bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300",
  special: "bg-rose-50 dark:bg-rose-900/40 text-rose-500 dark:text-rose-300",
};

const DEMO_BADGES = [
  { emoji: "🌱", tier: "1", label: "นักเขียนหน้าใหม่", tooltip: "สร้างหนังสือเล่มแรก" },
  { emoji: "🏆", tier: "3", label: "เชฟมือโปร", tooltip: "เพิ่มสูตรอาหารครบ 50 สูตร" },
  { emoji: "⭐", tier: "special", label: "ผู้สนับสนุน", tooltip: "สมาชิกระดับพิเศษ" },
  { emoji: "📚", tier: "4", label: "บรรณารักษ์", tooltip: "มีหนังสือสาธารณะครบ 5 เล่ม" },
];

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

  // Tab (border-bottom style)
  const [tab, setTab] = useState("หน้าแรก");

  // Tabs component (interactive)
  const [tabComp, setTabComp] = useState("tab-a");

  // Color picker
  const [color, setColor] = useState(STORE_COLORS[0]);

  // Loading button
  const [loading, setLoading] = useState(false);

  // Checkbox
  const [checks, setChecks] = useState({ a: true, b: false, c: true });

  // Radio
  const [radio, setRadio] = useState("r1");

  // Check list
  const [checkList, setCheckList] = useState([
    { id: "1", label: "แป้งสาลี 2 ถ้วย", done: true },
    { id: "2", label: "เนย 100 กรัม", done: false },
    { id: "3", label: "น้ำตาล 3 ช้อนโต๊ะ", done: true },
    { id: "4", label: "ไข่ไก่ 2 ฟอง", done: false },
  ]);

  // Combobox
  const [comboVal, setComboVal] = useState("");

  return (
    <div className="space-y-10">

      {/* ── Sandbox link ─────────────────────────────────────────── */}
      <Link
        href="/admin/ui-showcase/sandbox"
        className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-dashed border-orange-300 dark:border-orange-700/50 bg-orange-50/50 dark:bg-orange-900/10 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-100/60 dark:hover:bg-orange-900/20 transition-colors"
      >
        <FlaskConical className="w-4 h-4 shrink-0" />
        <span className="font-medium">Sandbox / Playground</span>
        <span className="text-xs text-orange-400 dark:text-orange-500 ml-auto">ทดสอบ UI ได้อิสระ →</span>
      </Link>

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
            <Tabs value={tabComp} onValueChange={setTabComp}>
              <TabsList>
                <TabsTrigger value="tab-a">Tab A</TabsTrigger>
                <TabsTrigger value="tab-b">Tab B</TabsTrigger>
                <TabsTrigger value="tab-c">Tab C</TabsTrigger>
              </TabsList>
            </Tabs>
            <AnimatePresence mode="wait">
              <motion.div
                key={tabComp}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="mt-3 px-4 py-3 rounded-xl bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20"
              >
                {tabComp === "tab-a" && (
                  <p className="text-sm text-secondary">เนื้อหาของ <span className="font-semibold text-foreground">Tab A</span> — ภาพรวมสูตรอาหาร</p>
                )}
                {tabComp === "tab-b" && (
                  <p className="text-sm text-secondary">เนื้อหาของ <span className="font-semibold text-foreground">Tab B</span> — รายการวัตถุดิบ</p>
                )}
                {tabComp === "tab-c" && (
                  <p className="text-sm text-secondary">เนื้อหาของ <span className="font-semibold text-foreground">Tab C</span> — ขั้นตอนการทำ</p>
                )}
              </motion.div>
            </AnimatePresence>
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

      {/* ── 16. Dropdown List (Select) ───────────────────────────── */}
      <Section title="Dropdown List (Select)">
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          {/* Standard select */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Select มาตรฐาน</label>
            <div className="relative">
              <select className="w-full appearance-none border border-border rounded-xl px-3 py-2.5 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400 pr-8 cursor-pointer">
                <option value="">-- เลือกหมวดหมู่ --</option>
                <option value="a">อาหารไทย</option>
                <option value="b">อาหารจีน</option>
                <option value="c">อาหารญี่ปุ่น</option>
                <option value="d">อาหารฝรั่ง</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            </div>
          </div>
          {/* Orange variant */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Select (orange border — form variant)</label>
            <div className="relative">
              <select className="w-full appearance-none border border-orange-300 rounded-xl px-3 py-2 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400 pr-8 cursor-pointer">
                <option value="">-- เลือกหน่วยวัด --</option>
                <option value="g">กรัม (g)</option>
                <option value="kg">กิโลกรัม (kg)</option>
                <option value="ml">มิลลิลิตร (ml)</option>
                <option value="l">ลิตร (l)</option>
                <option value="cup">ถ้วย (cup)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            </div>
          </div>
          {/* Disabled */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Select (disabled)</label>
            <div className="relative opacity-50">
              <select disabled className="w-full appearance-none border border-border rounded-xl px-3 py-2.5 text-sm bg-surface text-foreground focus:outline-none pr-8 cursor-not-allowed">
                <option>ปิดใช้งาน</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            </div>
          </div>
          <p className="text-xs text-muted"><Code>{"<select className='appearance-none ...'>"}</Code> + chevron overlay</p>
        </div>
      </Section>

      {/* ── 17. Hover Tooltip ────────────────────────────────────── */}
      <Section title="Hover Tooltip">
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <TooltipProvider>
            <div className="flex flex-wrap gap-3 items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="px-4 py-2 rounded-xl bg-elevated border border-border text-sm text-secondary hover:bg-border transition-colors">
                    Tooltip บน (top)
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">แสดงจากด้านบน</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="px-4 py-2 rounded-xl bg-elevated border border-border text-sm text-secondary hover:bg-border transition-colors">
                    Tooltip ล่าง (bottom)
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">แสดงจากด้านล่าง</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="px-4 py-2 rounded-xl bg-elevated border border-border text-sm text-secondary hover:bg-border transition-colors">
                    Tooltip ขวา (right)
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">แสดงจากด้านขวา</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-2 rounded-xl bg-elevated border border-border text-muted hover:text-foreground transition-colors">
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">ข้อมูลเพิ่มเติม</TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors">
                    No Delay
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">delayDuration=0 — แสดงทันที</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          <p className="text-xs text-muted">
            ต้องมี <Code>{"<TooltipProvider>"}</Code> ห่อไว้ · ใช้ <Code>{"side='top|bottom|left|right'"}</Code> · delay ค่า default 400ms
          </p>
        </div>
      </Section>

      {/* ── 18. Datepicker ───────────────────────────────────────── */}
      <Section title="Datepicker">
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Date Input มาตรฐาน</label>
            <input type="date"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Date Input (orange border — form variant)</label>
            <input type="date"
              className="w-full border border-orange-300 rounded-xl px-3 py-2 text-sm bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-orange-400" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Date Input (disabled)</label>
            <input type="date" disabled
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-surface text-foreground opacity-50 cursor-not-allowed" />
          </div>
          <p className="text-xs text-muted"><Code>{"<input type='date' />"}</Code> — native browser datepicker</p>
        </div>
      </Section>

      {/* ── 19. Checkbox ─────────────────────────────────────────── */}
      <Section title="Checkbox">
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-3">
          {(["a", "b", "c"] as const).map((k, i) => (
            <label key={k} className="flex items-center gap-3 cursor-pointer group">
              <button
                type="button"
                onClick={() => setChecks(p => ({ ...p, [k]: !p[k] }))}
                className={`w-[1.125rem] h-[1.125rem] rounded border-2 flex items-center justify-center shrink-0 transition-colors
                  ${checks[k] ? "bg-orange-500 border-orange-500" : "border-border group-hover:border-orange-300"}`}
              >
                {checks[k] && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </button>
              <span className={`text-sm transition-colors ${checks[k] ? "text-foreground" : "text-muted"}`}>
                {["ตัวเลือก A (checked)", "ตัวเลือก B (unchecked)", "ตัวเลือก C (checked)"][i]}
              </span>
            </label>
          ))}
          <label className="flex items-center gap-3 opacity-40 cursor-not-allowed">
            <div className="w-[1.125rem] h-[1.125rem] rounded border-2 border-orange-500 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-orange-500" strokeWidth={3} />
            </div>
            <span className="text-sm text-muted">Disabled (checked)</span>
          </label>
          <p className="text-xs text-muted pt-1"><Code>{"border-2 bg-orange-500 border-orange-500"}</Code> + <Code>{"<Check />"}</Code> เมื่อ checked</p>
        </div>
      </Section>

      {/* ── 20. Radio Button ─────────────────────────────────────── */}
      <Section title="Radio Button">
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-3">
          {[
            { id: "r1", label: "ตัวเลือก 1" },
            { id: "r2", label: "ตัวเลือก 2" },
            { id: "r3", label: "ตัวเลือก 3" },
          ].map(opt => (
            <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
              <button
                type="button"
                onClick={() => setRadio(opt.id)}
                className={`w-[1.125rem] h-[1.125rem] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                  ${radio === opt.id ? "border-orange-500" : "border-border group-hover:border-orange-300"}`}
              >
                {radio === opt.id && <div className="w-2 h-2 rounded-full bg-orange-500" />}
              </button>
              <span className={`text-sm transition-colors ${radio === opt.id ? "text-foreground font-medium" : "text-secondary"}`}>
                {opt.label}
              </span>
            </label>
          ))}
          <label className="flex items-center gap-3 opacity-40 cursor-not-allowed">
            <div className="w-[1.125rem] h-[1.125rem] rounded-full border-2 border-orange-500 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
            </div>
            <span className="text-sm text-muted">Disabled (selected)</span>
          </label>
          <p className="text-xs text-muted pt-1">เลือก: <span className="font-semibold text-foreground">{radio}</span></p>
        </div>
      </Section>

      {/* ── 21. Check List ───────────────────────────────────────── */}
      <Section title="Check List">
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          {checkList.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCheckList(p => p.map(x => x.id === item.id ? { ...x, done: !x.done } : x))}
              className={`w-full flex items-center gap-3 px-5 py-3 text-sm text-left hover:bg-elevated/60 transition-colors ${i > 0 ? "border-t border-border" : ""}`}
            >
              <div className={`w-[1.125rem] h-[1.125rem] rounded border-2 flex items-center justify-center shrink-0 transition-colors
                ${item.done ? "bg-orange-500 border-orange-500" : "border-border"}`}>
                {item.done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <span className={`flex-1 transition-colors ${item.done ? "line-through text-muted" : "text-foreground"}`}>
                {item.label}
              </span>
            </button>
          ))}
          <div className="px-5 py-2.5 border-t border-border bg-elevated/30">
            <p className="text-xs text-muted">เสร็จ {checkList.filter(x => x.done).length}/{checkList.length} รายการ</p>
          </div>
        </div>
      </Section>

      {/* ── 22. Achievement HoverCard ────────────────────────────── */}
      <Section title="Achievement HoverCard">
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <p className="text-xs text-muted">Hover (หรือกด) ที่ badge เพื่อดูรายละเอียด</p>
          <div className="flex flex-wrap gap-3">
            {DEMO_BADGES.map(b => (
              <HoverCard key={b.emoji} openDelay={150} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <button type="button"
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl select-none shadow-sm transition-transform hover:scale-110 active:scale-95 ${TIER_BG[b.tier]}`}>
                    {b.emoji}
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="p-3 w-44 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl leading-none">{b.emoji}</span>
                    <span className="text-sm font-semibold text-foreground leading-tight">{b.label}</span>
                  </div>
                  <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 ${TIER_PILL[b.tier]}`}>
                    {b.tier === "special" ? "Special" : `Tier ${b.tier}`}
                  </span>
                  <p className="text-xs text-muted leading-relaxed">{b.tooltip}</p>
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
          <p className="text-xs text-muted"><Code>{"<HoverCard> <HoverCardTrigger> <HoverCardContent>"}</Code> — spring animation, pinnable on click</p>
        </div>
      </Section>

      {/* ── 23. Combobox (searchable + creatable) ────────────────── */}
      <Section title="Combobox (Searchable + Creatable)">
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Combobox — ค้นหาหรือพิมพ์สร้างใหม่</label>
            <ShowcaseCombobox value={comboVal} onChange={setComboVal} />
          </div>
          {comboVal && (
            <p className="text-xs text-secondary">
              เลือก: <span className="font-semibold text-foreground">{comboVal}</span>
              <button type="button" onClick={() => setComboVal("")}
                className="ml-2 text-muted hover:text-red-500 transition-colors">
                <X className="w-3 h-3 inline" />
              </button>
            </p>
          )}
          <p className="text-xs text-muted">
            กรอกชื่อที่ไม่มีในรายการ → ปุ่ม <Code>เพิ่ม "..."</Code> จะปรากฏขึ้น · ใช้ใน RecipeForm สำหรับวัตถุดิบ / หน่วยวัด
          </p>
        </div>
      </Section>

    </div>
  );
}
