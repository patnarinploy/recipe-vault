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
import { Plus, Edit2, List, Palette, X, MoreHorizontal, GripVertical, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Globe, User, Youtube } from "lucide-react";
import type { Book, Recipe, WriterInfo } from "@/lib/types";
import WriterCard from "./WriterCard";

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
      const portrait = vw < 1024;   // single-page below lg breakpoint
      const availH = vh - CORNER_PAD * 2;
      const availW = portrait ? vw - 16 : (vw - 16) / 2;
      const scale = Math.max(0.3, Math.min(availH / BASE_H, availW / BASE_W, 2.0));
      setDims({ pageW: Math.round(BASE_W * scale), pageH: Math.round(BASE_H * scale), portrait, ready: true });
    }
    calc();
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(t); t = setTimeout(calc, 80); };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); clearTimeout(t); };
  }, []);
  return dims;
}

// ─── Style tokens ─────────────────────────────────────────────────
const PAGE_BORDER  = "inset 0 0 0 1px rgba(0,0,0,0.10)";
const COVER_BORDER = "inset 0 0 0 1px rgba(0,0,0,0.08)";

// ─── Pagination — fixed pixel measurements (calibrated for 14px text) ─
const LINE_H_PX     = 34;  // 14px × 1.625 leading-relaxed + 10px flex gap (inst steps)
const TOC_ITEM_H_PX = 36;  // height of one TOC row
const CHAR_W_PX     = 10;  // avg Thai char width at ~14px

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
  const overheadCont = 155;  // max-scale clamp values: pad(24)×2 + spacer(32) + crumb(13) + head(29) + pn(23) = 145 + 10 buffer
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
  | { kind: "recipe-ing";   recipeIdx: number; chunkIdx: number; ingText: string; instFirstChunk?: string; instFirstYtLinks?: { step: number; url: string }[] }
  | { kind: "recipe-inst";  recipeIdx: number; chunkIdx: number; instText: string; youtubeLinks?: { step: number; url: string }[]; showMeta?: boolean }
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

// Parse structured instructions JSON → plain numbered text for page chunking.
function instPlainText(raw: string): string {
  if (!raw?.trim()) return "";
  try {
    const steps = JSON.parse(raw);
    if (Array.isArray(steps) && steps.length > 0 && "text" in steps[0]) {
      return steps.filter((s: { text?: string }) => s.text?.trim())
                  .map((s: { text: string }, i: number) => `${i + 1}. ${s.text.trim()}`)
                  .join("\n");
    }
  } catch {}
  // Plain-text fallback: auto-number each line so step numbers always render.
  return raw.split("\n")
    .map(l => l.trim()).filter(Boolean)
    .map((l, i) => /^\d+\./.test(l) ? l : `${i + 1}. ${l}`)
    .join("\n");
}

// Collect YouTube links from structured instructions JSON.
function instYoutubeLinks(raw: string): { step: number; url: string }[] {
  try {
    const steps = JSON.parse(raw);
    if (Array.isArray(steps)) {
      return (steps as { text?: string; youtube?: string }[])
        .map((s, i) => ({ step: i + 1, url: s.youtube ?? "" }))
        .filter(s => s.url.trim());
    }
  } catch {}
  return [];
}

// Counts how many display rows a block of text occupies given charsPerLine.
function lineCount(text: string, charsPerLine: number): number {
  if (!text?.trim()) return 0;
  return text.split("\n").reduce((sum, line) => {
    return sum + Math.max(1, Math.ceil((line.length || 0.1) / charsPerLine));
  }, 0);
}

// Builds the flat ordered array of page slots from the recipe list.
// Content flows sequentially: all ingredients pages first, then instructions.
// In spread mode each recipe takes an even number of slots so the next
// recipe starts on a left page; watermark/filler slots enforce this.
// In portrait mode all spacing slots are omitted — every page is content.

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 0xff},${(n >> 8) & 0xff},${n & 0xff},${alpha})`;
}

function ShareBadge({ coverColor }: { coverColor: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap"
          style={{ background: hexToRgba(coverColor, 0.18), color: coverColor }}>
      <Globe className="w-2.5 h-2.5" /> แชร์แล้ว
    </span>
  );
}

function buildSlots(
  recipes: Recipe[],
  pageH: number,
  pageW: number,
  portrait: boolean,
): { slots: PageSlot[]; recipeSlotMap: number[]; itemsPerPage: number } {
  const { charsPerLine, ingLinesFirst, contLines, itemsPerPage } = pageLimits(pageH, pageW);

  const slots: PageSlot[] = [{ kind: "cover-front" }];

  // Inside-cover is purely a spread spacer — skip in portrait
  if (!portrait) slots.push({ kind: "inside-cover" });

  const tocPages = Math.max(1, Math.ceil(recipes.length / itemsPerPage));
  for (let t = 0; t < tocPages; t++) slots.push({ kind: "toc", tocPage: t });

  // Filler for spread alignment — not needed in portrait
  if (!portrait && recipes.length > 0 && slots.length % 2 === 0)
    slots.push({ kind: "filler" });

  const recipeSlotMap: number[] = [];
  for (let ri = 0; ri < recipes.length; ri++) {
    recipeSlotMap.push(slots.length);
    const r = recipes[ri];

    // All ingredients go to recipe-ing slots; recipe-first is image-only
    const ingAllChunks = toChunks(r.ingredients || "", charsPerLine, contLines, contLines)
                           .filter(c => c.trim().length > 0);
    const fullInstText = instPlainText(r.instructions || "");
    const ytLinks      = instYoutubeLinks(r.instructions || "");

    slots.push({ kind: "recipe-first", recipeIdx: ri, ingText: "" });

    // Track what instructions still need their own pages after embedding.
    let instOverflowText = fullInstText;
    let ytLinksOnIng    = false;

    // Embed the first portion of instructions on the ingredient page when:
    //   • ingredients fit on exactly one page (so there IS remaining vertical space)
    //   • there are instructions to show
    // Key difference from the old approach: we measure the actual remaining rows
    // using splitText(instAvail) so the embedded chunk NEVER overflows.
    if (ingAllChunks.length === 1 && fullInstText.trim()) {
      const ingItems  = ingAllChunks[0].split("\n").filter(l => l.trim()).length;
      // 2-column layout kicks in at ≥5 items; each row holds 2 items
      const ingRows   = ingItems >= 5 ? Math.ceil(ingItems / 2) : lineCount(ingAllChunks[0], charsPerLine);
      // Reserve 5 rows: meta grid adds ~3 rows overhead vs plain page, + heading + safety buffer
      const instAvail = contLines - ingRows - 5;

      if (instAvail >= 2) {
        const [instEmbed, instRest] = splitText(fullInstText, charsPerLine, instAvail);
        slots.push({
          kind: "recipe-ing", recipeIdx: ri, chunkIdx: 0, ingText: ingAllChunks[0],
          instFirstChunk: instEmbed,
          ...(ytLinks.length > 0 ? { instFirstYtLinks: ytLinks } : {}),
        });
        instOverflowText = instRest;
        ytLinksOnIng    = ytLinks.length > 0;
      } else {
        slots.push({ kind: "recipe-ing", recipeIdx: ri, chunkIdx: 0, ingText: ingAllChunks[0] });
      }
    } else {
      for (let ci = 0; ci < ingAllChunks.length; ci++)
        slots.push({ kind: "recipe-ing", recipeIdx: ri, chunkIdx: ci, ingText: ingAllChunks[ci] });
    }

    // Paginate instructions that didn't fit on the ingredient page
    const instChunks = instOverflowText.trim()
      ? toChunks(instOverflowText, charsPerLine, contLines, contLines).filter(c => c.trim().length > 0)
      : [];

    for (let ci = 0; ci < instChunks.length; ci++)
      slots.push({
        kind: "recipe-inst", recipeIdx: ri, chunkIdx: ci, instText: instChunks[ci],
        ...(ci === 0 && !ytLinksOnIng && ytLinks.length > 0 ? { youtubeLinks: ytLinks } : {}),
        ...(ci === 0 && ingAllChunks.length === 0 ? { showMeta: true } : {}),
      });

    // Watermark for spread alignment — skip in portrait.
    if (!portrait) {
      const total = 1 + ingAllChunks.length + instChunks.length;
      if (total % 2 !== 0) slots.push({ kind: "recipe-wm", recipeIdx: ri });
    }
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
    <p className={`shrink-0 mt-auto pt-3 text-[11px] font-mono text-[#c4ad8e] tracking-widest ${right ? "text-right" : ""}`}>
      {String(n).padStart(2, "0")}
    </p>
  );
}

// ─── Author button — uses native listener so pageflip never sees mousedown ───
function AuthorClickButton({ label, onClick }: { label: string; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const stop = (e: Event) => { e.stopPropagation(); };
    el.addEventListener("mousedown", stop);
    el.addEventListener("touchstart", stop, { passive: true });
    return () => {
      el.removeEventListener("mousedown", stop);
      el.removeEventListener("touchstart", stop);
    };
  }, []);
  return (
    <button
      ref={ref}
      onClick={onClick}
      className="text-white/50 hover:text-white/80 italic tracking-widest transition-colors text-left block"
      style={{ fontSize: "clamp(8px,1.8vw,11px)" }}
    >
      by {label}
    </button>
  );
}

// ─── Page components ──────────────────────────────────────────────
const PageCoverFront = forwardRef<HTMLDivElement, { book: Book; publicCount: number; authorName?: string; onAuthorClick?: () => void }>(({ book, publicCount, authorName, onAuthorClick }, ref) => {
  const C = book.cover_color;
  return (
    <div ref={ref} data-density="hard" style={{ position: "relative" }}>
      <div className="w-full h-full flex overflow-hidden" style={{ boxShadow: COVER_BORDER, borderRadius: 2 }}>
        <div className="shrink-0 flex items-center justify-center relative overflow-hidden"
             style={{ width: "8.2%", background: `linear-gradient(to right,${darken(C, 28)},${C})` }}>
          <div className="absolute top-0 bottom-0 right-0 pointer-events-none"
               style={{ width: 1, background: "rgba(255,255,255,0.28)" }} />
          <span className="text-white/30 tracking-[.4em] truncate uppercase relative z-10"
                style={{ writingMode: "vertical-rl", fontSize: "clamp(6px,1.6vw,8px)" }}>
            {book.title}
          </span>
        </div>
        <div className="flex-1 relative flex items-center justify-center" style={{ background: C }}>
          <div className="absolute pointer-events-none rounded-sm"
               style={{ top: "4%", right: "6%", width: "clamp(28px,12%,52px)", height: "clamp(10px,3.5%,18px)",
                 background: "linear-gradient(90deg,rgba(212,184,150,.6),rgba(232,208,172,.75),rgba(212,184,150,.6))",
                 transform: "rotate(9deg)", boxShadow: "0 1px 3px rgba(0,0,0,.1)" }} />

          {/* Title frame + author stacked so author sits just below the frame */}
          <div style={{ width: "calc(100% - 1.5rem)" }}>
            <div className="border border-white/22 text-center text-white flex flex-col items-center justify-center gap-2 w-full"
                 style={{ padding: "clamp(1.5rem,8%,3rem) 1rem" }}>
              <p className="tracking-[.38em] text-white/48 uppercase truncate w-full"
                 style={{ fontSize: "clamp(8px,1.8vw,11px)" }}>
                {book.tagline ?? "ตำรับอาหาร"}
              </p>
              <div className="w-1/3 h-px bg-white/20" />
              <h2 className="font-bold leading-tight break-words w-full"
                  style={{ fontSize: "clamp(1.4rem,5vw,2.4rem)", fontFamily: "'Playfair Display','Thonburi',Georgia,serif" }}>
                {book.title}
              </h2>
              {book.subtitle && (<>
                <div className="w-12 h-px bg-white/20 mt-1" />
                <p className="text-white/65 text-sm leading-snug mt-1">{book.subtitle}</p>
              </>)}
            </div>

            {/* Author — directly below the title frame, left-aligned */}
            {authorName && (
              <div className="mt-2 px-1">
                {onAuthorClick
                  ? <AuthorClickButton label={authorName} onClick={onAuthorClick} />
                  : <p className="text-white/50 italic tracking-widest"
                       style={{ fontSize: "clamp(8px,1.8vw,11px)", fontFamily: "Georgia,'Times New Roman',serif" }}>
                      by {authorName}
                    </p>
                }
              </div>
            )}
          </div>
        </div>
      </div>
      {publicCount > 0 && (
        <div className="absolute z-10 pointer-events-none whitespace-nowrap"
             style={{ bottom: 44, right: 5, background: "rgba(255,255,255,0.95)", color: C,
               fontSize: 11, padding: "4px 12px", borderRadius: 9999,
               display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
          <Globe style={{ width: 14, height: 14 }} /> แชร์ {publicCount}
        </div>
      )}
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
  { recipes: Recipe[]; tocPage: number; itemsPerPage: number; recipeSlotMap: number[]; onNavigate: (pageIdx: number) => void; coverColor: string; density: "soft" | "hard" }
>(({ recipes, tocPage, itemsPerPage, recipeSlotMap, onNavigate, coverColor, density }, ref) => {
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
    <div ref={ref} data-density={density}>
      <div className="w-full h-full bg-[#fef9f0] flex flex-col relative"
           style={{ padding: "clamp(1.25rem,2.5vw,2.5rem)", boxShadow: PAGE_BORDER, borderRadius: 2 }}>
        <Tape />
        <p className="text-[9px] tracking-[.38em] text-[#8a7354] uppercase font-semibold mb-2 mt-5">
          {isCont ? "Table of Contents (cont.)" : "Table of Contents"}
        </p>
        <h2 className="text-2xl font-bold text-stone-700 mb-5 leading-tight">
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
                    <span className="shrink-0 text-stone-700 truncate max-w-[55%]">{r.title}</span>
                    {r.is_public && <ShareBadge coverColor={coverColor} />}
                    <span className="border-b border-dotted border-stone-300 flex-1 mx-2" />
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

// ─── Ingredient bullet item ───────────────────────────────────────
function IngItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-1.5 min-w-0">
      <span className="shrink-0 rounded-full" style={{ width: 4, height: 4, minWidth: 4, background: "#e67e22", marginTop: "clamp(4px,0.65vw,6px)" }} />
      <span className="text-[#2c1e14] leading-snug" style={{ fontSize: "clamp(10px,1.7vw,14px)" }}>{text}</span>
    </div>
  );
}

// ─── Section heading with gold gradient rule ──────────────────────
function PageSectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="shrink-0 font-bold text-[#2c1e14]"
            style={{ fontFamily: "var(--font-playfair,'Playfair Display',Georgia,serif)", fontSize: "clamp(13px,2.5vw,20px)" }}>
        {children}
      </span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right,#d4af37 0%,rgba(212,175,55,0.15) 70%,transparent 100%)" }} />
    </div>
  );
}

// ─── Instruction step row (shared by inst page + combined ing/inst page) ─────
function InstructionStep({ line, fallbackNum }: { line: string; fallbackNum?: number }) {
  const m    = line.trim().match(/^(\d+)\.\s*(.*)/);
  const num  = m?.[1] ?? (fallbackNum != null ? String(fallbackNum) : undefined);
  const body = m?.[2] ?? line.trim();
  return (
    <div className="flex items-baseline min-w-0" style={{ gap: "clamp(5px,1vw,10px)" }}>
      {num && (
        <span className="shrink-0 select-none pointer-events-none"
              style={{ fontFamily: "var(--font-playfair,'Playfair Display',Georgia,serif)", fontStyle: "italic", fontSize: "clamp(14px,2.7vw,23px)", color: "#d4af37", opacity: 0.55, lineHeight: 1 }}>
          {num}
        </span>
      )}
      <span className="text-[#2c1e14] flex-1 leading-relaxed" style={{ fontSize: "clamp(10px,1.7vw,14px)" }}>
        {body}
      </span>
    </div>
  );
}

// ─── YouTube step links (shared by inst page + combined ing/inst page) ────────
function YoutubeLinks({ links }: { links?: { step: number; url: string }[] }) {
  if (!links?.length) return null;
  return (
    <div className="flex flex-wrap shrink-0" style={{ gap: "clamp(2px,0.5vw,4px)", marginTop: "clamp(4px,0.8vw,8px)" }}>
      {links.map(({ step, url }) => (
        <a key={step} href={url} target="_blank" rel="noopener noreferrer"
           onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}
           className="flex items-center gap-1 text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors font-medium"
           style={{ fontSize: "clamp(5.5px,1vw,8px)", padding: "clamp(2px,0.4vw,4px) clamp(5px,1vw,8px)" }}>
          <Youtube className="w-2 h-2 shrink-0" />
          Step {step}
        </a>
      ))}
    </div>
  );
}

// ─── Left recipe cover page — full-bleed editorial image ──────────
const PageRecipeFirst = forwardRef<
  HTMLDivElement,
  { recipe: Recipe; ingText: string; pn: number; coverColor: string; density: "soft" | "hard" }
>(({ recipe: r, pn, coverColor, density }, ref) => {
  const imgRef       = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);
  const target       = useRef({ x: 0, y: 0 });
  const current      = useRef({ x: 0, y: 0 });

  // Parallax RAF loop — runs only while component is mounted
  useEffect(() => {
    const MAX_PX = 14;
    function tick() {
      current.current.x += (target.current.x - current.current.x) * 0.07;
      current.current.y += (target.current.y - current.current.y) * 0.07;
      if (imgRef.current) {
        const tx = current.current.x * MAX_PX;
        const ty = current.current.y * MAX_PX;
        imgRef.current.style.transform = `scale(1.1) translate(${tx}px,${ty}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    target.current = {
      x: (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2),
      y: (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2),
    };
  }

  function onMouseLeave() { target.current = { x: 0, y: 0 }; }

  return (
    <div ref={ref} data-density={density}>
      <div ref={containerRef}
           className="w-full h-full relative overflow-hidden"
           style={{ borderRadius: 2, boxShadow: PAGE_BORDER }}
           onMouseMove={onMouseMove}
           onMouseLeave={onMouseLeave}>

        {/* Full-bleed food image — parallax target */}
        {r.image_url ? (
          <img ref={imgRef} src={r.image_url} alt={r.title}
               className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
               style={{ filter: "sepia(10%) contrast(1.07) brightness(0.92)", willChange: "transform", transform: "scale(1.1)" }} />
        ) : (
          <div className="absolute inset-0"
               style={{ background: "linear-gradient(145deg,#1c1208 0%,#2e1e0a 100%)" }} />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: "linear-gradient(155deg,rgba(255,191,0,0.07) 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,0.9) 100%)" }} />
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
             style={{ height: "55%", background: "linear-gradient(to top,rgba(0,0,0,0.85) 0%,transparent 100%)" }} />

        {/* Bottom text block */}
        <div className="absolute bottom-0 left-0 right-0 text-white"
             style={{ padding: "clamp(12px,2.5vw,28px)", paddingBottom: "clamp(14px,2.8vw,30px)" }}>

          <div className="flex items-center flex-wrap mb-[clamp(16px,3vw,28px)]" style={{ gap: "clamp(4px,0.8vw,8px)" }}>
            <span className="uppercase"
                  style={{ fontFamily: "var(--font-jetbrains,'JetBrains Mono',monospace)", fontSize: "clamp(10px,1.8vw,14px)", color: "#ffbf00", letterSpacing: "0.3em", opacity: 0.9 }}>
              {[r.category, r.cook_time_minutes ? `${r.cook_time_minutes} นาที` : null]
                .filter(Boolean).join("  ·  ") || "Recipe"}
            </span>
            {r.is_public && <ShareBadge coverColor={coverColor} />}
          </div>

          <h2 className="font-black leading-[0.88]"
              style={{ fontSize: "clamp(1.6rem,6vw,3.6rem)", textShadow: "1px 3px 14px rgba(0,0,0,0.65)", letterSpacing: "-0.01em" }}>
            {r.title}
          </h2>

          {r.description && (
            <p className="mt-[clamp(10px,1.8vw,16px)] leading-snug text-white/65 font-light"
               style={{ fontSize: "clamp(9.5px,1.7vw,13px)", maxWidth: "92%",
                        display: "-webkit-box", WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {r.description}
            </p>
          )}

          <div className="mt-[clamp(6px,1.2vw,12px)]"
               style={{ width: "clamp(20px,4vw,36px)", height: 1, background: "rgba(255,191,0,0.55)" }} />

          <p className="mt-[clamp(3px,0.6vw,6px)] text-white/25 tracking-widest"
             style={{ fontSize: "clamp(6.5px,1vw,9px)", fontFamily: "var(--font-jetbrains,'JetBrains Mono',monospace)" }}>
            {String(pn).padStart(2, "0")}
          </p>
        </div>
      </div>
    </div>
  );
});
PageRecipeFirst.displayName = "PageRecipeFirst";

// ─── Right recipe detail page — cream editorial layout ────────────
const PageRecipeCont = forwardRef<
  HTMLDivElement,
  { recipe: Recipe; label: string; text: string; lh: string; isRight: boolean; pn: number; density: "soft" | "hard"; youtubeLinks?: { step: number; url: string }[]; variant?: "ing" | "inst"; showMeta?: boolean; showRibbon?: boolean; instFirstChunk?: string; instFirstYtLinks?: { step: number; url: string }[] }
>(({ recipe: r, text, isRight, pn, density, youtubeLinks, variant = "ing", showMeta = false, showRibbon = false, instFirstChunk, instFirstYtLinks }, ref) => {
  const ingLines  = variant === "ing"  ? text.split("\n").filter(l => l.trim()) : [];
  const instLines = variant === "inst" ? text.split("\n").filter(l => l.trim()) : [];
  const half      = Math.ceil(ingLines.length / 2);
  const use2Col   = ingLines.length >= 5;
  const colA      = use2Col ? ingLines.slice(0, half) : ingLines;
  const colB      = use2Col ? ingLines.slice(half)    : [];

  return (
    <div ref={ref} data-density={density}>
      <div className="w-full h-full flex flex-col relative overflow-hidden"
           style={{ background: "#fffaf0", boxShadow: PAGE_BORDER, borderRadius: 2, padding: "clamp(12px,2.2vw,24px)" }}>

        {/* Bookmark ribbon — first right page of recipe only */}
        {showRibbon && (
          <div className="absolute top-0 z-10"
               style={{
                 [isRight ? "right" : "left"]: "clamp(10px,2vw,18px)",
                 width: "clamp(15px,2.8vw,24px)",
                 height: "clamp(38px,7.5vw,64px)",
                 background: "linear-gradient(160deg,#c0392b 0%,#8e1c12 100%)",
                 clipPath: "polygon(0 0,100% 0,100% 100%,50% 87%,0 100%)",
                 boxShadow: "1px 2px 6px rgba(0,0,0,0.28)",
               }} />
        )}

        {/* ── Meta grid (first page only) ─────────────────── */}
        {showMeta && (
          <>
            <div className="grid grid-cols-3 mt-7 mb-3 shrink-0" style={{ gap: "clamp(4px,1vw,10px)" }}>
              {([
                { lbl: "CATEGORY", val: r.category ?? "—" },
                { lbl: "PREP",     val: r.cook_time_minutes ? `${r.cook_time_minutes} นาที` : "—" },
                { lbl: "SERVINGS", val: r.servings ? `${r.servings} ที่` : "—" },
              ] as const).map(({ lbl, val }) => (
                <div key={lbl} className="flex flex-col items-center text-center" style={{ gap: "clamp(1px,0.3vw,3px)" }}>
                  <span className="uppercase text-stone-400"
                        style={{ fontFamily: "var(--font-jetbrains,'JetBrains Mono',monospace)", fontSize: "clamp(7.5px,1.15vw,10px)", letterSpacing: "0.22em" }}>
                    {lbl}
                  </span>
                  <span className="font-bold text-[#2c1e14] leading-tight"
                        style={{ fontSize: "clamp(10px,1.7vw,14px)" }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-px bg-stone-200 mb-3 shrink-0" />
          </>
        )}

        {/* Spacer when no meta */}
        {!showMeta && <div className="shrink-0" style={{ height: "clamp(18px,3.5vw,32px)" }} />}

        {/* Recipe name breadcrumb */}
        <p className="truncate mb-[clamp(3px,0.7vw,6px)] shrink-0 uppercase"
           style={{ fontFamily: "var(--font-jetbrains,'JetBrains Mono',monospace)", fontSize: "clamp(5px,0.85vw,7px)", color: "#c4a46e", letterSpacing: "0.25em" }}>
          {r.title}
        </p>

        {/* Section heading */}
        <div className="mb-[clamp(5px,1vw,9px)] shrink-0">
          <PageSectionHead>{variant === "ing" ? "Ingredients" : "Instructions"}</PageSectionHead>
        </div>

        {/* ── Ingredients ─────────────────────────────────── */}
        {variant === "ing" && (
          <div className={instFirstChunk ? "overflow-hidden shrink-0" : "flex-1 overflow-hidden"}>
            {use2Col ? (
              <div className="flex h-full" style={{ gap: "clamp(6px,1.2vw,12px)" }}>
                <div className="flex-1 flex flex-col" style={{ gap: "clamp(2px,0.4vw,4px)" }}>
                  {colA.map((t, i) => <IngItem key={i} text={t} />)}
                </div>
                <div className="flex-1 flex flex-col" style={{ gap: "clamp(2px,0.4vw,4px)" }}>
                  {colB.map((t, i) => <IngItem key={i} text={t} />)}
                </div>
              </div>
            ) : (
              <div className="flex flex-col" style={{ gap: "clamp(2px,0.4vw,4px)" }}>
                {colA.map((t, i) => <IngItem key={i} text={t} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Instructions embedded on the ingredient page ── */}
        {variant === "ing" && instFirstChunk && (
          <>
            <div className="my-[clamp(4px,0.8vw,8px)] shrink-0">
              <PageSectionHead>Instructions</PageSectionHead>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col" style={{ gap: "clamp(4px,0.8vw,8px)" }}>
              {instFirstChunk.split("\n").filter(l => l.trim()).map((line, i) => (
                <InstructionStep key={i} line={line} fallbackNum={i + 1} />
              ))}
            </div>
            <YoutubeLinks links={instFirstYtLinks} />
          </>
        )}

        {/* ── Instructions ─────────────────────────────────── */}
        {variant === "inst" && (
          <div className="flex-1 overflow-hidden flex flex-col" style={{ gap: "clamp(5px,1vw,10px)" }}>
            {instLines.map((line, i) => <InstructionStep key={i} line={line} fallbackNum={i + 1} />)}
          </div>
        )}

        <YoutubeLinks links={youtubeLinks} />

        <Pn n={pn} right={isRight} />
      </div>
    </div>
  );
});
PageRecipeCont.displayName = "PageRecipeCont";

// Watermark page — spread alignment filler; maintains cream theme.
const PageRecipeWatermark = forwardRef<HTMLDivElement, { recipe: Recipe; isRight: boolean; density: "soft" | "hard" }>(
  ({ recipe: r, density }, ref) => (
    <div ref={ref} data-density={density}>
      <div className="w-full h-full flex items-center justify-center relative overflow-hidden"
           style={{ background: "#fffaf0", boxShadow: PAGE_BORDER, borderRadius: 2 }}>
        <div className="text-center select-none pointer-events-none px-8"
             style={{ opacity: 0.07, transform: "rotate(-10deg)" }}>
          <p className="font-black text-[#2c1e14] break-words leading-tight"
             style={{ fontFamily: "var(--font-playfair,'Playfair Display',Georgia,serif)", fontSize: "clamp(1.4rem,5.5vw,3rem)" }}>
            {r.title}
          </p>
        </div>
      </div>
    </div>
  )
);
PageRecipeWatermark.displayName = "PageRecipeWatermark";

const PageFiller = forwardRef<HTMLDivElement, { density: "soft" | "hard" }>(({ density }, ref) => (
  <div ref={ref} data-density={density}>
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

const PageBackCover = forwardRef<HTMLDivElement, { book: Book }>(({ book }, ref) => {
  const C = book.cover_color;
  return (
    <div ref={ref} data-density="hard">
      <div className="w-full h-full flex overflow-hidden" style={{ boxShadow: COVER_BORDER, borderRadius: 2 }}>
        {/* Cover face */}
        <div className="flex-1 flex items-center justify-center" style={{ background: C }}>
          <div className="w-8 h-px bg-white/20" />
        </div>
        {/* Spine — right side, mirrored from front */}
        <div className="shrink-0 relative overflow-hidden flex items-center justify-center"
             style={{ width: "8.2%", background: `linear-gradient(to left,${darken(C, 28)},${C})` }}>
          <div className="absolute top-0 bottom-0 left-0 pointer-events-none"
               style={{ width: 1, background: "rgba(255,255,255,0.28)" }} />
        </div>
      </div>
    </div>
  );
});
PageBackCover.displayName = "PageBackCover";

// ─── TOC Sort Modal ───────────────────────────────────────────────
function TocSortModal({ recipes, open, onClose, onSave, coverColor }: {
  recipes: Recipe[];
  open: boolean;
  onClose: () => void;
  onSave: (sorted: Recipe[]) => Promise<void>;
  coverColor: string;
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
                {r.is_public && <ShareBadge coverColor={coverColor} />}
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
  autoNewRecipe?: boolean;
}

// ─── Main component ───────────────────────────────────────────────
export default function BookReaderV2({ bookId, isOwner, onClose, autoNewRecipe }: Props) {
  const router = useRouter();
  const bookRef = useRef<any>(null);
  const fabRef  = useRef<HTMLDivElement>(null);
  const { pageW, pageH, portrait, ready } = usePageDimensions();

  const [book,    setBook]    = useState<Book | null>(null);
  const [recipes,    setRecipes]    = useState<Recipe[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [dataVersion, setDataVersion] = useState(0);
  const [flipType,    setFlipType]    = useState<"soft" | "hard">("soft");
  const [authorName,  setAuthorName]  = useState("");
  const [writerInfo,  setWriterInfo]  = useState<WriterInfo | null>(null);
  const [writerCardOpen, setWriterCardOpen] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem("rv_page_flip_type");
    if (v === "hard" || v === "soft") setFlipType(v);
  }, []);

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
    let recipeQ = sb.from("recipes").select("*").eq("book_id", bookId)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
    if (!isOwner) recipeQ = recipeQ.eq("is_public", true);
    const [bk, rc] = await Promise.all([
      sb.from("books").select("*, users(username, display_name, bio, avatar, role)").eq("id", bookId).single(),
      recipeQ.returns<Recipe[]>(),
    ]);
    if (bk.data) {
      setBook(bk.data as Book);
      const u = (bk.data as any).users;
      setAuthorName(u?.display_name ?? u?.username ?? "");
      if (u?.username) setWriterInfo({ username: u.username, display_name: u.display_name ?? null, bio: u.bio ?? null, avatar: u.avatar ?? null, role: u.role ?? undefined });
    }
    if (rc.data) setRecipes(rc.data);
    setLoading(false);
  }, [bookId]);

  useEffect(() => { setLoading(true); fetchData(); }, [fetchData, dataVersion]);

  // ── Slot-based page layout ────────────────────────────────────────
  const { slots, recipeSlotMap, itemsPerPage } = useMemo(
    () => buildSlots(recipes, pageH, pageW, portrait),
    [recipes, pageH, pageW, portrait],
  );

  // Clamp currentPage whenever slots change (portrait mode toggle can shrink slot count)
  useEffect(() => {
    if (currentPage >= slots.length) setCurrentPage(0);
  }, [slots.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-open new recipe dialog when launched from bookshelf shortcut
  useEffect(() => {
    if (autoNewRecipe && !loading && book) setNewRecipeOpen(true);
  }, [autoNewRecipe, loading, book]);

  // Close FAB menu on outside click
  useEffect(() => {
    if (!fabOpen) return;
    function onDown(e: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) setFabOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [fabOpen]);

  const firstTocIdx = slots.findIndex(s => s.kind === "toc");
  const goToToC     = () => bookRef.current?.pageFlip().turnToPage(Math.max(0, firstTocIdx));
  const goToPage    = useCallback((idx: number) => bookRef.current?.pageFlip().turnToPage(idx), []);
  const goToPrev    = useCallback(() => bookRef.current?.pageFlip().flipPrev(), []);
  const goToNext    = useCallback(() => bookRef.current?.pageFlip().flipNext(), []);

  // Keyboard arrow navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "ArrowLeft")  { e.preventDefault(); goToPrev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); goToNext(); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [goToPrev, goToNext]);

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
  const flipKey = `${flipType}:${portrait ? "p" : "l"}:${pageW}x${pageH}:${slots.length}:${dataVersion}`;

  const pages: React.ReactElement[] = slots.map((slot, si) => {
    const isRight = si % 2 === 0; // even index = right page in spread
    switch (slot.kind) {
      case "cover-front":  return <PageCoverFront key="cf" book={book} publicCount={recipes.filter(r => r.is_public).length} authorName={authorName} onAuthorClick={writerInfo ? () => setWriterCardOpen(true) : undefined} />;
      case "inside-cover": return <PageInsideCover key="ic" />;
      case "toc": return (
        <PageToC key={`toc-${slot.tocPage}`} recipes={recipes} tocPage={slot.tocPage}
                 itemsPerPage={itemsPerPage} recipeSlotMap={recipeSlotMap} onNavigate={goToPage}
                 coverColor={book.cover_color} density={flipType} />
      );
      case "filler": return <PageFiller key={`f-${si}`} density={flipType} />;
      case "recipe-first": return (
        <PageRecipeFirst key={`rf-${slot.recipeIdx}`}
                         recipe={recipes[slot.recipeIdx]} ingText={slot.ingText} pn={si}
                         coverColor={book.cover_color} density={flipType} />
      );
      case "recipe-ing": return (
        <PageRecipeCont key={`ri-${slot.recipeIdx}-${slot.chunkIdx}`}
                        recipe={recipes[slot.recipeIdx]}
                        label="" text={slot.ingText} lh="1.6"
                        isRight={isRight} pn={si} density={flipType}
                        variant="ing" showMeta={slot.chunkIdx === 0}
                        showRibbon={slot.chunkIdx === 0}
                        instFirstChunk={slot.instFirstChunk}
                        instFirstYtLinks={slot.instFirstYtLinks} />
      );
      case "recipe-inst": return (
        <PageRecipeCont key={`rinst-${slot.recipeIdx}-${slot.chunkIdx}`}
                        recipe={recipes[slot.recipeIdx]}
                        label="" text={slot.instText} lh="1.6"
                        isRight={isRight} pn={si} density={flipType}
                        youtubeLinks={slot.youtubeLinks}
                        variant="inst" showMeta={slot.showMeta ?? false}
                        showRibbon={slot.chunkIdx === 0 && (slot.showMeta ?? false)} />
      );
      case "recipe-wm": return (
        <PageRecipeWatermark key={`rw-${slot.recipeIdx}`}
                             recipe={recipes[slot.recipeIdx]} isRight={isRight} density={flipType} />
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
      <div className="relative book-modal-font" style={{ width: bookW, height: pageH, maxWidth: "100vw" }}>
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

        {/* ── FAB — bottom-right of the right page ─── */}
        <div className="absolute z-[10001] flex flex-col items-end gap-2"
             style={{ bottom: 5, right: 5 }}>
          {fabOpen && (
            <div ref={fabRef} className="anim-scale-in bg-white rounded-2xl shadow-xl border border-stone-100 p-1.5 min-w-[13rem] flex flex-col gap-0.5">

              {/* owner-only actions */}
              {isOwner && (<>
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

                {/* ดูการ์ดนักเขียน — cover */}
                {ctx === "cover" && writerInfo && (
                  <button onClick={() => { setFabOpen(false); setWriterCardOpen(true); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl">
                    <User className="w-4 h-4 text-stone-400" /> ดูการ์ดนักเขียน
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
                  <button onClick={() => { setFabOpen(false); goToToC(); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl">
                    <List className="w-4 h-4 text-stone-400" /> เปิดสารบัญ
                  </button>
                )}

                {/* ปิดหนังสือ — cover / backcover */}
                {(ctx === "cover" || ctx === "backcover") && (
                  <button onClick={() => { setFabOpen(false); onClose(); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl">
                    <X className="w-4 h-4 text-red-400" /> ปิดหนังสือ
                  </button>
                )}

                <div className="border-t border-stone-100 my-0.5" />
              </>)}

              {/* ดูการ์ดนักเขียน — cover (non-owner) */}
              {!isOwner && ctx === "cover" && writerInfo && (
                <button onClick={() => { setFabOpen(false); setWriterCardOpen(true); }}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl">
                  <User className="w-4 h-4 text-stone-400" /> ดูการ์ดนักเขียน
                </button>
              )}

              {/* navigation — ทุก context ทุก role */}
              <button
                onClick={() => { setFabOpen(false); goToPrev(); }}
                disabled={currentPage === 0}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4 text-stone-400" /> หน้าก่อนหน้า
              </button>
              <button
                onClick={() => { setFabOpen(false); goToNext(); }}
                disabled={currentPage >= slots.length - 1}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-xl disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4 text-stone-400" /> หน้าถัดไป
              </button>
            </div>
          )}

          {/* FAB trigger */}
          <button onClick={() => setFabOpen(o => !o)} aria-label="เมนู"
                  style={{ width: 30, height: 30 }}
                  className={`rounded-full shadow-xl flex items-center justify-center transition-all ${
                    fabOpen
                      ? "bg-stone-700 text-white rotate-90"
                      : "bg-orange-500 text-white hover:bg-orange-600 hover:scale-105"
                  }`}>
            {fabOpen ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
          </button>
        </div>
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
        coverColor={book.cover_color}
      />

      {writerInfo && (
        <Modal open={writerCardOpen} onClose={() => setWriterCardOpen(false)} maxWidth="max-w-sm">
          <div className="rounded-2xl overflow-hidden">
            <WriterCard info={writerInfo} />
          </div>
        </Modal>
      )}
    </>
  );
}
