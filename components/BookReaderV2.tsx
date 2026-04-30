"use client";

import HTMLFlipBook from "react-pageflip";
import { ReactSortable } from "react-sortablejs";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SkeletonOpenBook } from "./Skeleton";
import Modal from "./Modal";
import RecipeForm from "./RecipeForm";
import BookCoverEditor from "./BookCoverEditor";
import toast from "react-hot-toast";
import { Plus, Edit2, List, Palette, X, MoreHorizontal, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import type { Book, Recipe } from "@/lib/types";

// ─── Colour helper ────────────────────────────────────────────────
function darken(hex: string, amt: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - amt);
  const g = Math.max(0, ((n >> 8) & 0xff) - amt);
  const b = Math.max(0, (n & 0xff) - amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// ─── Page sizing ──────────────────────────────────────────────────
const BASE_W = 390;
const BASE_H = 540;
const CORNER_PAD = 20;

function usePageDimensions() {
  const [dims, setDims] = useState({ pageW: BASE_W, pageH: BASE_H, portrait: false, ready: false });
  useEffect(() => {
    function calc() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const portrait = vw < 640;
      const availH = vh - CORNER_PAD * 2;
      const availW = portrait ? vw - 16 : (vw - 16) / 2;
      const scale = Math.max(0.3, Math.min(availH / BASE_H, availW / BASE_W, 2.0));
      setDims({ pageW: Math.round(BASE_W * scale), pageH: Math.round(BASE_H * scale), portrait, ready: true });
    }
    calc();
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(t); t = setTimeout(calc, 300); };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); clearTimeout(t); };
  }, []);
  return dims;
}

// ─── Style tokens ─────────────────────────────────────────────────
const PAGE_BORDER  = "inset 0 0 0 1px rgba(0,0,0,0.10)";
const COVER_BORDER = "inset 0 0 0 1px rgba(0,0,0,0.08)";

// ─── Pagination — fixed pixel measurements (14 px text, fixed font) ─
const LINE_H_PX     = 26;  // ~14px × 1.85 line-height
const TOC_ITEM_H_PX = 36;  // height of one TOC row
const CHAR_W_PX     = 9;   // avg Thai char width at 14 px

// Derive per-page limits from the real rendered page size so that content
// never overflows when the user resizes the window.
function pageLimits(pageH: number, pageW: number) {
  const innerW      = Math.max(180, pageW - 40);           // subtract h-padding
  const charsPerLine = Math.max(18, Math.round(innerW / CHAR_W_PX));

  // First recipe page: subtract fixed chrome (title, divider, image, label, pn)
  const imgH         = Math.min(190, Math.max(90, Math.round(pageH * 0.35)));
  const overheadFirst = 40 + 20 + 36 + 17 + imgH + 16 + 22 + 25; // ≈366 at base
  const ingLinesFirst = Math.max(2, Math.floor((pageH - overheadFirst) / LINE_H_PX));

  // Continuation / instruction pages: subtract mini-header + pn
  const overheadCont = 40 + 18 + 13 + 22 + 25;            // ≈118 px
  const contLines    = Math.max(4, Math.floor((pageH - overheadCont) / LINE_H_PX));

  // TOC: subtract label + title area, then -1 as a safety margin so the last
  // row is never half-clipped by overflow-hidden.
  const overheadToc  = 40 + 26 + 48;                       // ≈114 px
  const itemsPerPage = Math.max(3, Math.floor((pageH - overheadToc) / TOC_ITEM_H_PX) - 1);

  return { charsPerLine, ingLinesFirst, contLines, itemsPerPage };
}

// ─── Page slot types ──────────────────────────────────────────────
type PageSlot =
  | { kind: "cover-front" }
  | { kind: "inside-cover" }
  | { kind: "toc"; tocPage: number }
  | { kind: "filler" }
  | { kind: "recipe-first"; recipeIdx: number; ingText: string }
  | { kind: "recipe-ing";   recipeIdx: number; chunkIdx: number; ingText: string }
  | { kind: "recipe-inst";  recipeIdx: number; chunkIdx: number; instText: string }
  | { kind: "recipe-wm";    recipeIdx: number }
  | { kind: "back-cover" }

// Splits text so the first returned value fits within maxLines display rows.
// Always takes at least one raw line to prevent infinite loops.
function splitText(text: string, charsPerLine: number, maxLines: number): [string, string] {
  const lines = (text || "").split("\n");
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    const w = Math.max(1, Math.ceil((lines[i].length || 0.1) / charsPerLine));
    if (count + w > maxLines) {
      const cut = Math.max(1, i);
      return [lines.slice(0, cut).join("\n"), lines.slice(cut).join("\n")];
    }
    count += w;
  }
  return [text || "", ""];
}

function toChunks(text: string, charsPerLine: number, firstMax: number, contMax: number): string[] {
  const chunks: string[] = [];
  let rem = text || "";
  let first = true;
  do {
    const [chunk, rest] = splitText(rem, charsPerLine, first ? firstMax : contMax);
    chunks.push(chunk);
    rem = rest;
    first = false;
  } while (rem);
  return chunks.length ? chunks : [""];
}

// Builds the flat ordered array of page slots from the recipe list.
// Content flows sequentially: all ingredients pages first, then instructions.
// Each recipe takes an even number of slots so the next recipe always starts
// on a left (odd-index) page. A watermark slot is appended when needed.
function buildSlots(
  recipes: Recipe[],
  pageH: number,
  pageW: number,
): { slots: PageSlot[]; recipeSlotMap: number[]; itemsPerPage: number } {
  const { charsPerLine, ingLinesFirst, contLines, itemsPerPage } = pageLimits(pageH, pageW);

  const slots: PageSlot[] = [{ kind: "cover-front" }, { kind: "inside-cover" }];

  const tocPages = Math.max(1, Math.ceil(recipes.length / itemsPerPage));
  for (let t = 0; t < tocPages; t++) slots.push({ kind: "toc", tocPage: t });

  // Align: first recipe must land on an odd index (left page in spread).
  if (recipes.length > 0 && slots.length % 2 === 0) slots.push({ kind: "filler" });

  const recipeSlotMap: number[] = [];
  for (let ri = 0; ri < recipes.length; ri++) {
    recipeSlotMap.push(slots.length);
    const r = recipes[ri];

    const ingChunks = toChunks(r.ingredients || "", charsPerLine, ingLinesFirst, contLines);
    const instChunks = toChunks(r.instructions || "", charsPerLine, contLines, contLines)
                         .filter(c => c.trim().length > 0);
    const ingContChunks = ingChunks.slice(1).filter(c => c.trim().length > 0);

    // First page: header + image + first ingredient chunk (always left)
    slots.push({ kind: "recipe-first", recipeIdx: ri, ingText: ingChunks[0] ?? "" });

    // Remaining ingredient chunks flow into subsequent pages
    for (let ci = 0; ci < ingContChunks.length; ci++)
      slots.push({ kind: "recipe-ing", recipeIdx: ri, chunkIdx: ci + 1, ingText: ingContChunks[ci] });

    // Instruction chunks start immediately after all ingredients
    for (let ci = 0; ci < instChunks.length; ci++)
      slots.push({ kind: "recipe-inst", recipeIdx: ri, chunkIdx: ci, instText: instChunks[ci] });

    // If total pages is odd, append a watermark so the next recipe starts on a left page
    const total = 1 + ingContChunks.length + instChunks.length;
    if (total % 2 !== 0) slots.push({ kind: "recipe-wm", recipeIdx: ri });
  }

  slots.push({ kind: "back-cover" });
  return { slots, recipeSlotMap, itemsPerPage };
}

// ─── Page helpers ─────────────────────────────────────────────────
function Tape({ right }: { right?: boolean }) {
  return (
    <div
      className="absolute top-4 pointer-events-none rounded-sm z-10"
      style={{
        width: 48, height: 16,
        [right ? "right" : "left"]: 16,
        background: "linear-gradient(90deg,rgba(212,184,150,.6),rgba(232,208,172,.75),rgba(212,184,150,.6))",
        transform: `rotate(${right ? 8 : -8}deg)`,
        boxShadow: "0 1px 3px rgba(0,0,0,.1)",
      }}
    />
  );
}

function Pn({ n, right }: { n: number; right?: boolean }) {
  return (
    <p className={`mt-auto pt-3 text-[11px] text-[#c4ad8e] tracking-widest ${right ? "text-right" : ""}`}
       style={{ fontFamily: "Georgia, serif" }}>
      {String(n).padStart(2, "0")}
    </p>
  );
}

// ─── Page components ──────────────────────────────────────────────
const PageCoverFront = forwardRef<HTMLDivElement, { book: Book }>(({ book }, ref) => {
  const C = book.cover_color;
  return (
    <div ref={ref} data-density="hard">
      <div className="w-full h-full flex overflow-hidden" style={{ boxShadow: COVER_BORDER, borderRadius: 2 }}>
        <div className="shrink-0 flex items-center justify-center"
             style={{ width: "8.2%", background: `linear-gradient(to right,${darken(C, 28)},${C})` }}>
          <span className="text-white/30 tracking-[.4em] truncate"
                style={{ writingMode: "vertical-rl", fontSize: "clamp(6px,1.6vw,8px)" }}>
            RECIPE BOOK
          </span>
        </div>
        <div className="flex-1 relative flex items-center justify-center" style={{ background: C }}>
          <div className="absolute pointer-events-none rounded-sm"
               style={{ top: "4%", right: "6%", width: "clamp(28px,12%,52px)", height: "clamp(10px,3.5%,18px)",
                 background: "linear-gradient(90deg,rgba(212,184,150,.6),rgba(232,208,172,.75),rgba(212,184,150,.6))",
                 transform: "rotate(9deg)", boxShadow: "0 1px 3px rgba(0,0,0,.1)" }} />
          <div className="border border-white/22 text-center text-white flex flex-col items-center justify-center gap-2 mx-3"
               style={{ width: "calc(100% - 1.5rem)", padding: "clamp(1.5rem,8%,3rem) 1rem" }}>
            <p className="tracking-[.38em] text-white/48 uppercase truncate w-full"
               style={{ fontSize: "clamp(8px,1.8vw,11px)" }}>ตำรับอาหาร</p>
            <div className="w-7 h-px bg-white/20" />
            <h2 className="font-bold leading-tight break-words w-full"
                style={{ fontSize: "clamp(1.4rem,5vw,2.4rem)", fontFamily: "'Playfair Display','Thonburi',Georgia,serif" }}>
              {book.title}
            </h2>
            {book.subtitle && (
              <p className="text-white/65 text-sm leading-snug">{book.subtitle}</p>
            )}
            <div className="w-7 h-px bg-white/20" />
            <p className="text-white/55" style={{ fontSize: "clamp(9px,2vw,12px)" }}>
              {book.tagline ?? "คอลเลกชันส่วนตัว"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
PageCoverFront.displayName = "PageCoverFront";

const PageInsideCover = forwardRef<HTMLDivElement, object>((_p, ref) => (
  <div ref={ref} data-density="hard">
    <div className="w-full h-full bg-[#fef9f0]" style={{ boxShadow: PAGE_BORDER, borderRadius: 2 }} />
  </div>
));
PageInsideCover.displayName = "PageInsideCover";

const PageToC = forwardRef<
  HTMLDivElement,
  { recipes: Recipe[]; tocPage: number; itemsPerPage: number; recipeSlotMap: number[]; onNavigate: (pageIdx: number) => void }
>(({ recipes, tocPage, itemsPerPage, recipeSlotMap, onNavigate }, ref) => {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const stop = (e: Event) => {
      if ((e.target as Element)?.closest("button")) e.stopPropagation();
    };
    el.addEventListener("mousedown", stop);
    el.addEventListener("touchstart", stop);
    return () => {
      el.removeEventListener("mousedown", stop);
      el.removeEventListener("touchstart", stop);
    };
  }, []);

  const start        = tocPage * itemsPerPage;
  const pageRecipes  = recipes.slice(start, start + itemsPerPage);
  const isCont       = tocPage > 0;

  return (
    <div ref={ref}>
      <div className="w-full h-full bg-[#fef9f0] flex flex-col relative"
           style={{ padding: "clamp(1.25rem,2.5vw,2.5rem)", boxShadow: PAGE_BORDER, borderRadius: 2 }}>
        <Tape />
        <p className="text-[9px] tracking-[.38em] text-[#8a7354] uppercase font-semibold mb-2 mt-1">
          {isCont ? "Table of Contents (cont.)" : "Table of Contents"}
        </p>
        <h2 className="text-2xl font-bold text-stone-700 mb-5 leading-tight"
            style={{ fontFamily: "'Playfair Display','Thonburi',Georgia,serif" }}>
          {isCont ? "สารบัญ (ต่อ)" : "สารบัญ"}
        </h2>
        <nav ref={navRef} className="flex-1 space-y-0.5 overflow-hidden">
          {recipes.length === 0
            ? <p className="text-sm text-stone-400 italic">ยังไม่มีสูตรอาหาร</p>
            : pageRecipes.map((r, localIdx) => {
                const ri      = start + localIdx;
                const slotIdx = recipeSlotMap[ri] ?? 0;
                return (
                  <button
                    key={r.id}
                    onClick={() => onNavigate(slotIdx)}
                    className="w-full flex items-center gap-1 px-2 py-1.5 text-sm rounded-lg hover:bg-amber-50 active:bg-amber-100 transition-colors text-left"
                  >
                    <span className="flex-1 text-stone-700 truncate">{r.title}</span>
                    <span className="border-b border-dotted border-stone-300 w-8 shrink-0 mx-2" />
                    <span className="shrink-0 text-[11px] font-mono text-stone-400">
                      {String(slotIdx).padStart(2, "0")}
                    </span>
                  </button>
                );
              })
          }
        </nav>
      </div>
    </div>
  );
});
PageToC.displayName = "PageToC";

// First page of a recipe — always a left page (odd slot index).
const PageRecipeFirst = forwardRef<
  HTMLDivElement,
  { recipe: Recipe; ingText: string; pn: number }
>(({ recipe: r, ingText, pn }, ref) => (
  <div ref={ref}>
    <div className="w-full h-full bg-[#fef9f0] flex flex-col relative"
         style={{ padding: "clamp(1.25rem,2.5vw,2.5rem)", boxShadow: PAGE_BORDER, borderRadius: 2 }}>
      <Tape />
      <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-1.5">
        {[r.category, r.cook_time_minutes ? `${r.cook_time_minutes} นาที` : null].filter(Boolean).join(" · ")}
      </p>
      <h2 className="text-xl font-bold text-stone-800 leading-tight mb-3">{r.title}</h2>
      <div className="h-px bg-[#e8d5b7] mb-4" />
      {r.image_url
        ? <img src={r.image_url} alt={r.title} className="rounded-md object-cover shrink-0 mb-4 w-full"
               style={{ height: "clamp(90px,20vh,190px)" }} />
        : <div className="rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 mb-4"
               style={{ height: "clamp(90px,20vh,190px)" }}>
            <span className="text-stone-300 text-xs italic">[ ภาพประกอบ ]</span>
          </div>
      }
      <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-2">วัตถุดิบ:</p>
      <div className="flex-1 overflow-hidden text-sm text-stone-600 leading-[1.85] whitespace-pre-line">
        {ingText}
      </div>
      <Pn n={pn} />
    </div>
  </div>
));
PageRecipeFirst.displayName = "PageRecipeFirst";

// Continuation page — handles ingredient overflow, instruction, and watermark.
// isRight is derived from the slot index (even = right, odd = left).
const PageRecipeCont = forwardRef<
  HTMLDivElement,
  { recipe: Recipe; label: string; text: string; lh: string; isRight: boolean; pn: number }
>(({ recipe: r, label, text, lh, isRight, pn }, ref) => (
  <div ref={ref}>
    <div className="w-full h-full bg-[#fef9f0] flex flex-col relative"
         style={{ padding: "clamp(1.25rem,2.5vw,2.5rem)", boxShadow: PAGE_BORDER, borderRadius: 2 }}>
      <Tape right={isRight} />
      <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-1 truncate">{r.title}</p>
      <div className="h-px bg-[#e8d5b7] mb-3" />
      <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-2">{label}</p>
      <div className="flex-1 overflow-hidden text-sm text-stone-600 whitespace-pre-line" style={{ lineHeight: lh }}>
        {text}
      </div>
      <Pn n={pn} right={isRight} />
    </div>
  </div>
));
PageRecipeCont.displayName = "PageRecipeCont";

// Watermark page — shown when a recipe ends on an odd page count.
const PageRecipeWatermark = forwardRef<HTMLDivElement, { recipe: Recipe; isRight: boolean }>(
  ({ recipe: r, isRight }, ref) => (
    <div ref={ref}>
      <div className="w-full h-full bg-[#fef9f0] flex items-center justify-center relative"
           style={{ boxShadow: PAGE_BORDER, borderRadius: 2 }}>
        <Tape right={isRight} />
        <p className="text-[clamp(1.6rem,6vw,3rem)] font-bold text-stone-100 text-center leading-tight px-8 break-words pointer-events-none select-none"
           style={{ fontFamily: "'Playfair Display','Thonburi',Georgia,serif", transform: "rotate(-12deg)" }}>
          {r.title}
        </p>
      </div>
    </div>
  )
);
PageRecipeWatermark.displayName = "PageRecipeWatermark";

const PageFiller = forwardRef<HTMLDivElement, object>((_p, ref) => (
  <div ref={ref}>
    <div className="w-full h-full bg-[#fef9f0] flex items-center justify-center"
         style={{ boxShadow: PAGE_BORDER, borderRadius: 2 }}>
      <div className="text-center select-none pointer-events-none">
        <div className="w-12 h-px bg-stone-200 mx-auto mb-3" />
        <p className="text-[9px] tracking-[.32em] text-stone-200 uppercase">ตำรับอาหาร</p>
        <div className="w-12 h-px bg-stone-200 mx-auto mt-3" />
      </div>
    </div>
  </div>
));
PageFiller.displayName = "PageFiller";

const PageBackCover = forwardRef<HTMLDivElement, { book: Book }>(({ book }, ref) => (
  <div ref={ref} data-density="hard">
    <div className="w-full h-full flex items-center justify-center"
         style={{ background: book.cover_color, boxShadow: COVER_BORDER, borderRadius: 2 }}>
      <div className="w-8 h-px bg-white/20" />
    </div>
  </div>
));
PageBackCover.displayName = "PageBackCover";

// ─── TOC Sort Modal ───────────────────────────────────────────────
function TocSortModal({ recipes, open, onClose, onSave }: {
  recipes: Recipe[];
  open: boolean;
  onClose: () => void;
  onSave: (sorted: Recipe[]) => Promise<void>;
}) {
  const [sorted, setSorted] = useState<Recipe[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setSorted([...recipes]); }, [open, recipes]);

  const move = (i: number, dir: -1 | 1) => {
    setSorted(s => {
      const n = [...s], j = i + dir;
      if (j < 0 || j >= n.length) return s;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(sorted); } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="เรียงลำดับสูตรอาหาร">
      <div className="bg-white rounded-b-2xl border border-stone-100 border-t-0 p-4 sm:p-5">
        <p className="text-xs text-stone-400 mb-3">ลากที่ไอคอน ⠿ หรือกดลูกศร เพื่อเปลี่ยนลำดับ</p>
        <div className="space-y-1 max-h-[52vh] overflow-y-auto">
          <ReactSortable
            list={sorted}
            setList={setSorted}
            handle=".toc-drag-handle"
            animation={150}
            ghostClass="sortable-ghost"
            chosenClass="sortable-chosen"
            dragClass="sortable-drag"
          >
            {sorted.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center gap-2 px-2 py-2 rounded-xl border border-transparent hover:bg-stone-50 hover:border-stone-100 transition-colors select-none"
              >
                <GripVertical className="toc-drag-handle w-4 h-4 text-stone-400 shrink-0 cursor-grab active:cursor-grabbing" />
                <span className="w-5 text-center text-xs text-stone-300 font-mono shrink-0">{i + 1}</span>
                <span className="flex-1 text-sm text-stone-700 truncate">{r.title}</span>
                {r.category && (
                  <span className="text-[10px] text-stone-400 shrink-0 hidden sm:block">{r.category}</span>
                )}
                <div className="flex gap-0.5 shrink-0">
                  <button onClick={() => move(i, -1)} disabled={i === 0}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 disabled:opacity-20 text-stone-500 transition-colors">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === sorted.length - 1}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 disabled:opacity-20 text-stone-500 transition-colors">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </ReactSortable>
        </div>
        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-stone-100">
          <button onClick={onClose}
                  className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-xl transition-colors">
            ยกเลิก
          </button>
          <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 text-sm bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1.5 transition-colors">
            {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> กำลังบันทึก...</> : "บันทึก"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Props ────────────────────────────────────────────────────────
interface Props {
  bookId: string;
  isOwner: boolean;
  onClose: () => void;
}

// ─── Main component ───────────────────────────────────────────────
export default function BookReaderV2({ bookId, isOwner, onClose }: Props) {
  const router = useRouter();
  const bookRef = useRef<any>(null);
  const { pageW, pageH, portrait, ready } = usePageDimensions();

  const [book,    setBook]    = useState<Book | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);

  // Page tracking
  const [currentPage, setCurrentPage] = useState(0);

  // FAB
  const [fabOpen,         setFabOpen]         = useState(false);
  const [newRecipeOpen,   setNewRecipeOpen]   = useState(false);
  const [editRecipeOpen,  setEditRecipeOpen]  = useState(false);
  const [coverEditorOpen, setCoverEditorOpen] = useState(false);
  const [tocSortOpen,     setTocSortOpen]     = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const sb = createClient();
    const [bk, rc] = await Promise.all([
      sb.from("books").select("*").eq("id", bookId).single<Book>(),
      sb.from("recipes").select("*").eq("book_id", bookId)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true })
        .returns<Recipe[]>(),
    ]);
    if (bk.data) setBook(bk.data);
    if (rc.data) setRecipes(rc.data);
    setLoading(false);
  }, [bookId]);

  useEffect(() => { setLoading(true); fetchData(); }, [fetchData, dataVersion]);

  // ── Slot-based page layout ────────────────────────────────────────
  const { slots, recipeSlotMap, itemsPerPage } = useMemo(
    () => buildSlots(recipes, pageH, pageW),
    [recipes, pageH, pageW],
  );

  const goToToC  = () => bookRef.current?.pageFlip().turnToPage(2);
  const goToPage = useCallback((idx: number) => bookRef.current?.pageFlip().turnToPage(idx), []);

  const currentSlot = slots[currentPage] ?? slots[0];
  type Ctx = "cover" | "toc" | "recipe" | "backcover";
  let ctx: Ctx = "cover";
  let recipeIdx = -1;
  if (currentSlot.kind === "cover-front") ctx = "cover";
  else if (currentSlot.kind === "inside-cover" || currentSlot.kind === "toc" || currentSlot.kind === "filler") ctx = "toc";
  else if (currentSlot.kind === "back-cover") ctx = "backcover";
  else if (
    currentSlot.kind === "recipe-first" || currentSlot.kind === "recipe-ing" ||
    currentSlot.kind === "recipe-inst"  || currentSlot.kind === "recipe-wm"
  ) {
    ctx = "recipe";
    recipeIdx = currentSlot.recipeIdx;
  }
  const currentRecipe = recipeIdx >= 0 ? recipes[recipeIdx] ?? null : null;

  const handleSort = async (sorted: Recipe[]) => {
    const { updateRecipeOrder } = await import("@/app/actions/recipes");
    const res = await updateRecipeOrder(bookId, sorted.map(r => r.id));
    if ("error" in res) { toast.error(res.error); return; }
    toast.success("บันทึกลำดับแล้ว");
    setTocSortOpen(false);
    await refreshAndReset(2);
  };

  // ── Refresh helpers ────────────────────────────────────────────────
  const refreshAndReset = useCallback(async (goTo = 0) => {
    await fetchData();
    setCurrentPage(goTo);
    setDataVersion(v => v + 1);
    router.refresh();
  }, [fetchData, router]);

  // ─────────────────────────────────────────────────────────────────
  if (!ready || loading || !book) return <SkeletonOpenBook />;

  const bookW   = portrait ? pageW : pageW * 2;
  const flipKey = `${pageW}x${pageH}:${dataVersion}`;

  const pages: React.ReactElement[] = slots.map((slot, si) => {
    const isRight = si % 2 === 0; // even index = right page in spread
    switch (slot.kind) {
      case "cover-front":  return <PageCoverFront key="cf" book={book} />;
      case "inside-cover": return <PageInsideCover key="ic" />;
      case "toc": return (
        <PageToC key={`toc-${slot.tocPage}`} recipes={recipes} tocPage={slot.tocPage}
                 itemsPerPage={itemsPerPage} recipeSlotMap={recipeSlotMap} onNavigate={goToPage} />
      );
      case "filler": return <PageFiller key={`f-${si}`} />;
      case "recipe-first": return (
        <PageRecipeFirst key={`rf-${slot.recipeIdx}`}
                         recipe={recipes[slot.recipeIdx]} ingText={slot.ingText} pn={si} />
      );
      case "recipe-ing": return (
        <PageRecipeCont key={`ri-${slot.recipeIdx}-${slot.chunkIdx}`}
                        recipe={recipes[slot.recipeIdx]}
                        label="วัตถุดิบ (ต่อ):" text={slot.ingText} lh="1.85"
                        isRight={isRight} pn={si} />
      );
      case "recipe-inst": return (
        <PageRecipeCont key={`rinst-${slot.recipeIdx}-${slot.chunkIdx}`}
                        recipe={recipes[slot.recipeIdx]}
                        label={slot.chunkIdx === 0 ? "วิธีทำ:" : "วิธีทำ (ต่อ):"}
                        text={slot.instText} lh="1.95"
                        isRight={isRight} pn={si} />
      );
      case "recipe-wm": return (
        <PageRecipeWatermark key={`rw-${slot.recipeIdx}`}
                             recipe={recipes[slot.recipeIdx]} isRight={isRight} />
      );
      case "back-cover": return <PageBackCover key="cb" book={book} />;
    }
  });

  // FAB size scales with page width (36–56 px)
  const fabSize = Math.max(36, Math.min(56, Math.round(pageW * 0.13)));

  return (
    <>
      {/* Book container — relative so the FAB can be absolutely positioned
          at the bottom-right of the right page without overlapping content */}
      <div className="relative font-apple" style={{ width: bookW, height: pageH }}>
        <HTMLFlipBook
          key={flipKey}
          ref={bookRef}
          width={pageW} height={pageH}
          minWidth={100} maxWidth={900}
          minHeight={100} maxHeight={1300}
          size="fixed" startPage={currentPage} startZIndex={20} autoSize={false}
          flippingTime={800} usePortrait={portrait}
          drawShadow={true} showCover={true} maxShadowOpacity={0.45}
          showPageCorners={false} mobileScrollSupport={true}
          clickEventForward={false} useMouseEvents={true}
          swipeDistance={10} disableFlipByClick={false}
          className="" style={{}}
          onFlip={(e: any) => setCurrentPage(e.data)}
          onChangeState={(e: any) => {
            if (e.data === "read") {
              const p = bookRef.current?.pageFlip().getCurrentPageIndex();
              if (p != null) setCurrentPage(p);
            }
          }}
        >
          {pages}
        </HTMLFlipBook>

        {/* ── FAB (owner only) — bottom-right of the right page ─── */}
        {isOwner && (
          <div className="absolute z-[10001] flex flex-col items-end gap-2"
               style={{ bottom: Math.round(fabSize * 0.22), right: Math.round(fabSize * 0.22) }}>
            {fabOpen && (
              <div className="anim-scale-in bg-white rounded-2xl shadow-xl border border-stone-100 p-1.5 min-w-[13rem] flex flex-col gap-0.5">

                {/* เพิ่มสูตร — ทุก context */}
                <button onClick={() => { setFabOpen(false); setNewRecipeOpen(true); }}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl">
                  <Plus className="w-4 h-4 text-stone-400" /> เพิ่มสูตรในเล่มนี้
                </button>

                {/* แก้ไขปก — cover / backcover */}
                {(ctx === "cover" || ctx === "backcover") && (
                  <button onClick={() => { setFabOpen(false); setCoverEditorOpen(true); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl">
                    <Palette className="w-4 h-4 text-stone-400" /> แก้ไขปกหนังสือ
                  </button>
                )}

                {/* แก้ไขสารบัญ — toc */}
                {ctx === "toc" && (
                  <button onClick={() => { setFabOpen(false); setTocSortOpen(true); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl">
                    <List className="w-4 h-4 text-stone-400" /> แก้ไขสารบัญ
                  </button>
                )}

                {/* แก้ไขสูตร — recipe */}
                {ctx === "recipe" && currentRecipe && (
                  <button onClick={() => { setFabOpen(false); setEditRecipeOpen(true); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl">
                    <Edit2 className="w-4 h-4 text-stone-400" /> แก้ไขสูตรนี้
                  </button>
                )}

                {/* เปิดสารบัญ — cover / backcover / recipe */}
                {(ctx === "cover" || ctx === "backcover" || ctx === "recipe") && (
                  <>
                    <div className="border-t border-stone-100 my-0.5" />
                    <button onClick={() => { setFabOpen(false); goToToC(); }}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl">
                      <List className="w-4 h-4 text-stone-400" /> เปิดสารบัญ
                    </button>
                  </>
                )}

                {/* ปิดหนังสือ — cover / backcover */}
                {(ctx === "cover" || ctx === "backcover") && (
                  <button onClick={() => { setFabOpen(false); onClose(); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl">
                    <X className="w-4 h-4 text-red-400" /> ปิดหนังสือ
                  </button>
                )}
              </div>
            )}

            {/* FAB trigger — scales with pageW */}
            <button onClick={() => setFabOpen(o => !o)} aria-label="เมนู"
                    style={{ width: fabSize, height: fabSize }}
                    className={`rounded-full shadow-xl flex items-center justify-center transition-all ${
                      fabOpen
                        ? "bg-stone-700 text-white rotate-90"
                        : "bg-orange-500 text-white hover:bg-orange-600 hover:scale-105"
                    }`}>
              {fabOpen ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>

      {/* ── Sub-modals ──────────────────────────────────────────── */}
      <Modal open={newRecipeOpen} onClose={() => setNewRecipeOpen(false)} title="เพิ่มสูตรในเล่มนี้">
        <RecipeForm bookId={bookId} inModal
          onSuccess={() => { setNewRecipeOpen(false); refreshAndReset(2); }}
          onCancel={() => setNewRecipeOpen(false)} />
      </Modal>

      {currentRecipe && (
        <Modal open={editRecipeOpen} onClose={() => setEditRecipeOpen(false)} title="แก้ไขสูตรอาหาร">
          <RecipeForm recipe={currentRecipe} bookId={bookId} inModal showDelete
            onSuccess={() => { setEditRecipeOpen(false); refreshAndReset(currentPage); }}
            onCancel={() => setEditRecipeOpen(false)}
            onDeleted={() => { setEditRecipeOpen(false); refreshAndReset(2); }} />
        </Modal>
      )}

      <Modal open={coverEditorOpen} onClose={() => setCoverEditorOpen(false)} title="แก้ไขปกหนังสือ" maxWidth="max-w-3xl">
        <BookCoverEditor book={book} inModal
          onSuccess={() => { setCoverEditorOpen(false); refreshAndReset(currentPage); }}
          onCancel={() => setCoverEditorOpen(false)} />
      </Modal>

      <TocSortModal
        recipes={recipes}
        open={tocSortOpen}
        onClose={() => setTocSortOpen(false)}
        onSave={handleSort}
      />
    </>
  );
}
