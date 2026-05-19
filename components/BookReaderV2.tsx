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
import { toast } from "sonner";
import { BUILD_NUMBER } from "@/lib/build-version";
import { pushModal, popModal, isTopModal } from "@/lib/modalStack";
import { Plus, Edit2, List, Palette, X, MoreHorizontal, GripVertical, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Globe, User } from "lucide-react";
import type { Book, Recipe, WriterInfo } from "@/lib/types";
import WriterCard from "./WriterCard";
import { useLocale, type Dict } from "@/lib/locale";

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
  const [dims, setDims] = useState({ pageW: BASE_W, pageH: BASE_H, portrait: false, ready: false, vwPx: 1440, vhPx: 900 });
  useEffect(() => {
    function calc() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const portrait = vw < 1024;   // single-page below lg breakpoint
      const availH = vh - CORNER_PAD * 2;
      const availW = portrait ? vw - 16 : (vw - 16) / 2;
      const scale = Math.max(0.3, Math.min(availH / BASE_H, availW / BASE_W, 2.0));
      setDims({ pageW: Math.round(BASE_W * scale), pageH: Math.round(BASE_H * scale), portrait, ready: true, vwPx: vw, vhPx: vh });
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

// ─── Pagination helpers ───────────────────────────────────────────

// canvas.measureText() is the primary measurement path (handles Thai combining
// chars correctly). charsPerLine computed below is an SSR-only fallback.

const _ctxCache = new Map<string, CanvasRenderingContext2D>();
function canvasCtx(fontSpec: string): CanvasRenderingContext2D | null {
  if (typeof window === "undefined") return null;
  let ctx = _ctxCache.get(fontSpec);
  if (!ctx) {
    const c = document.createElement("canvas").getContext("2d");
    if (!c) return null;
    c.font = fontSpec;
    _ctxCache.set(fontSpec, c);
    ctx = c;
  }
  return ctx;
}

type MeasureFn = (line: string) => number;
function makeMeasure(fontSpec: string, innerW: number): MeasureFn {
  return (line: string) => {
    if (!line) return 1;
    const ctx = canvasCtx(fontSpec);
    if (!ctx) return 1;
    return Math.max(1, Math.ceil(ctx.measureText(line).width / innerW));
  };
}

// Compute per-page content limits from actual viewport px values so each
// limit exactly matches the CSS clamp() values the renderer uses.
// cv(lo,factor,hi) mirrors clamp(lo px, factor*vmin, hi px).
// cw(lo,factor,hi) mirrors clamp(lo px, factor*vw,   hi px).
function pageLimits(pageH: number, pageW: number, vwPx: number, vhPx: number) {
  const vmin = Math.min(vwPx, vhPx);
  const cv = (lo: number, factor: number, hi: number) =>
    Math.min(hi, Math.max(lo, factor * vmin));
  const cw = (lo: number, factor: number, hi: number) =>
    Math.min(hi, Math.max(lo, factor * vwPx));

  // Page padding: clamp(12px, 2vmin, 22px)
  const padPx = cv(12, 0.02, 22);

  // No-meta spacer (replaces meta grid): clamp(12px, 3vmin, 28px)
  const spacerPx = cv(12, 0.03, 28);

  // Breadcrumb row: font clamp(8px,1.4vmin,12px) × 1.5lh + mb clamp(3px,0.7vw,6px)
  const crumbMbPx = cw(3, 0.007, 6);
  const crumbPx   = cv(8, 0.014, 12) * 1.5 + crumbMbPx;

  // Section heading: font clamp(15px,3vmin,28px) × 1.2lh + mb clamp(5px,1vw,9px)
  const headFontPx = cv(15, 0.03, 28);
  const headMbPx   = cw(5, 0.01, 9);
  const headPx     = headFontPx * 1.2 + headMbPx;

  // Page number footer: pt-3(12px) + 11px text × 1.5lh
  const pnPx = 12 + 11 * 1.5;

  // Chrome overhead — no-meta page (spacer instead of meta grid)
  const ohCont = 2 * padPx + spacerPx + crumbPx + headPx + pnPx;

  // Meta grid overhead: label clamp(10px,2vmin,18px) + gap clamp(1px,0.3vw,3px) + value clamp(9px,1.8vmin,16px)
  const metaLabelPx = cv(10, 0.02, 18);
  const metaValPx   = cv(9, 0.018, 16);
  const metaGapPx   = cw(1, 0.003, 3);
  const metaCellPx  = metaLabelPx * 1.2 + metaGapPx + metaValPx * 1.25;
  const metaGridPx  = 12 + metaCellPx + 12;   // py-3 top + cell + py-3 bottom
  const dividerPx   = 1 + 12;                  // border + mb

  // Chrome overhead — first ingredient page (has meta grid instead of spacer)
  const ohMeta = 2 * padPx + metaGridPx + dividerPx + crumbPx + headPx + pnPx;

  // Embedded instructions section heading height (on the combined ing+inst page):
  // my clamp(4px,0.8vw,8px) × 2 sides + headFontPx × 1.2lh
  const instMyPx = cw(4, 0.008, 8);
  const ihEmbed  = 2 * instMyPx + headFontPx * 1.2;

  // Ingredient item height: font clamp(11px,1.8vmin,16px) × 1.375lh + gap clamp(2px,0.4vw,4px)
  const ingFontPx = cv(11, 0.018, 16);
  const ingGapPx  = cw(2, 0.004, 4);
  const lhIng     = ingFontPx * 1.375 + ingGapPx;

  // Instruction step height: the step row uses items-baseline, so height is
  // driven by whichever is taller — the Playfair Display italic number span
  // (clamp(15px,2.9vw,25px), lineHeight:1) or the body text span
  // (clamp(11px,1.8vmin,16px), leading-relaxed=1.625). Because of baseline
  // geometry the number's effective row contribution is ≈ fontSize×1.2
  // (empirically confirmed: 25px Playfair → 29.88px measured step height).
  const instFontPx   = cv(11, 0.018, 16);
  const numFontPx    = cw(15, 0.029, 25);   // clamp(15px,2.9vw,25px)
  const stepH        = Math.max(numFontPx * 1.2, instFontPx * 1.625);
  const instGapEmbed = cw(4, 0.008, 8);
  const instGapPure  = cw(5, 0.01, 10);
  const lhInstEmbed  = stepH + instGapEmbed;
  const lhInstPure   = stepH + instGapPure;

  const innerW       = Math.max(180, pageW - 2 * Math.round(padPx));
  // SSR fallback: 8px/char conservative estimate. canvas.measureText() used in buildSlots
  // when fonts are ready — this value is only hit during server render or before font load.
  const charsPerLine = Math.max(18, Math.round(innerW / 8));

  // N items use N×itemH + (N-1)×gap = N×slotH - gap px. Adding the saved
  // trailing gap back into the numerator recovers one extra slot at tight budgets
  // (e.g. 1440×500 gains +1 embedded step) without reducing safety headroom.
  const contLinesInst     = Math.max(4, Math.floor((pageH - ohCont + instGapPure) / lhInstPure) - 1);
  const contLinesIngFirst = Math.max(4, Math.floor((pageH - ohMeta  + ingGapPx)   / lhIng));
  const contLinesIngCont  = Math.max(4, Math.floor((pageH - ohCont  + ingGapPx)   / lhIng));

  // TOC typography — mirrors recipe-page vmin-based scaling philosophy.
  // Every cv()/cw() value here MUST match the CSS clamp() string in PageToC JSX.
  const tocPadPx      = cw(20, 0.025, 40);   // page padding: clamp(20px,2.5vw,40px)
  const tocMetaMtPx   = cv(8,  0.018, 20);   // meta mt:      clamp(8px,1.8vmin,20px)
  const tocMetaPx     = cv(8,  0.014, 11);   // meta font:    clamp(8px,1.4vmin,11px)
  const tocMetaMbPx   = cv(3,  0.005,  7);   // meta mb:      clamp(3px,0.5vmin,7px)
  const tocTitlePx    = cv(16, 0.035, 28);   // h2 font:      clamp(16px,3.5vmin,28px)
  const tocTitleMbPx  = cv(8,  0.018, 20);   // h2 mb:        clamp(8px,1.8vmin,20px)
  const tocItemFontPx = cv(11, 0.022, 15);   // row font:     clamp(11px,2.2vmin,15px)
  const tocItemPyPx   = cv(4,  0.009,  7);   // row py:       clamp(4px,0.9vmin,7px)
  const tocItemGapPx  = cv(1,  0.002,  3);   // row gap:      clamp(1px,0.2vmin,3px)
  const tocRowH       = Math.round(tocItemFontPx * 1.5 + 2 * tocItemPyPx);
  // Overhead = 2× page-padding + meta strip (mt + font×lh + mb) + title strip (font×lh + mb)
  const tocOverhead   = 2 * tocPadPx
    + tocMetaMtPx + tocMetaPx * 1.5 + tocMetaMbPx
    + tocTitlePx  * 1.25 + tocTitleMbPx;
  const itemsPerPage  = Math.max(3, Math.floor((pageH - tocOverhead + tocItemGapPx) / (tocRowH + tocItemGapPx)));

  // Step image height for budget calculation: clamp(80px,20vmin,200px)
  const imgHPx      = cv(80, 0.20, 200);
  const imgRowCost  = Math.ceil((imgHPx + instGapPure) / lhInstPure);

  // YouTube block height: matches YoutubeBlock CSS: width=min(innerW, clamp(80px,20vmin,200px)×16/9)
  // so height = min(innerW×9/16, clamp(80px,20vmin,200px))
  const ytHPx         = Math.min(innerW * 9 / 16, cv(80, 0.20, 200));
  const ytRowCost     = Math.ceil((ytHPx + instGapPure)  / lhInstPure);
  const ytRowCostEmbed = Math.ceil((ytHPx + instGapEmbed) / lhInstEmbed);

  return { charsPerLine, contLinesInst, contLinesIngFirst, contLinesIngCont,
           ohMeta, lhIng, lhInstEmbed, instGapEmbed, ihEmbed, itemsPerPage,
           innerW, ingFontPx, instFontPx, imgRowCost, ytRowCost, ytRowCostEmbed };
}

// ─── Page slot types ──────────────────────────────────────────────
type PageSlot =
  | { kind: "cover-front" }
  | { kind: "inside-cover" }
  | { kind: "toc"; tocPage: number }
  | { kind: "filler" }
  | { kind: "recipe-first"; recipeIdx: number; ingText: string }
  | { kind: "recipe-ing";   recipeIdx: number; chunkIdx: number; ingText: string; instFirstChunk?: string; instFirstStepImages?: { step: number; url: string }[]; youtubeUrl?: string }
  | { kind: "recipe-inst";  recipeIdx: number; chunkIdx: number; instText: string; youtubeUrl?: string; stepImages?: { step: number; url: string }[]; showMeta?: boolean }
  | { kind: "recipe-wm";      recipeIdx: number }
  | { kind: "recipe-youtube"; recipeIdx: number; youtubeUrl: string }
  | { kind: "back-cover" }

// Splits text so the first returned value fits within maxLines display rows.
// Always takes at least one raw line to prevent infinite loops.
// measure() — when provided — returns accurate pixel-based row count per line (canvas path).
// Falls back to charsPerLine estimation during SSR or before fonts load.
function splitText(text: string, charsPerLine: number, maxLines: number, measure?: MeasureFn): [string, string] {
  const lines = (text || "").split("\n");
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    const w = measure
      ? measure(lines[i])
      : Math.max(1, Math.ceil((lines[i].length || 0.1) / charsPerLine));
    if (count + w > maxLines) {
      const cut = Math.max(1, i);
      return [lines.slice(0, cut).join("\n"), lines.slice(cut).join("\n")];
    }
    count += w;
  }
  return [text || "", ""];
}

function toChunks(text: string, charsPerLine: number, firstMax: number, contMax: number, measure?: MeasureFn): string[] {
  const chunks: string[] = [];
  let rem = text || "";
  let first = true;
  do {
    const [chunk, rest] = splitText(rem, charsPerLine, first ? firstMax : contMax, measure);
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

// Collect per-step images from structured instructions JSON.
function instStepImages(raw: string): { step: number; url: string }[] {
  try {
    const steps = JSON.parse(raw);
    if (Array.isArray(steps)) {
      return (steps as { image_url?: string | null }[])
        .map((s, i) => ({ step: i + 1, url: s.image_url ?? "" }))
        .filter(s => s.url.trim());
    }
  } catch {}
  return [];
}

// Counts how many display rows a block of text occupies.
function lineCount(text: string, charsPerLine: number, measure?: MeasureFn): number {
  if (!text?.trim()) return 0;
  return text.split("\n").reduce((sum, line) => {
    return sum + (measure
      ? measure(line)
      : Math.max(1, Math.ceil((line.length || 0.1) / charsPerLine)));
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

function ShareBadge({ coverColor, solid }: { coverColor: string; solid?: boolean }) {
  return (
    <span className="inline-flex items-center leading-none gap-1 text-[10px] font-semibold px-1.5 py-[3px] rounded-full shrink-0 whitespace-nowrap"
          style={solid
            ? { background: coverColor, color: "white" }
            : { background: hexToRgba(coverColor, 0.18), color: coverColor }}>
      <Globe className="w-2.5 h-2.5 shrink-0" /> Shared
    </span>
  );
}

function buildSlots(
  recipes: Recipe[],
  pageH: number,
  pageW: number,
  portrait: boolean,
  vwPx: number,
  vhPx: number,
  fontsReady: boolean,
): { slots: PageSlot[]; recipeSlotMap: number[]; itemsPerPage: number } {
  const { charsPerLine, contLinesInst, contLinesIngFirst, contLinesIngCont,
          ohMeta, lhIng, lhInstEmbed, instGapEmbed, ihEmbed, itemsPerPage,
          innerW, ingFontPx, instFontPx, imgRowCost, ytRowCost, ytRowCostEmbed } = pageLimits(pageH, pageW, vwPx, vhPx);

  // Build canvas-based measure closures once fonts are loaded.
  const fontBase    = "'IBM Plex Sans Thai', Sarabun, sans-serif";
  const ingFontSpec  = `400 ${Math.round(ingFontPx)}px ${fontBase}`;
  const instFontSpec = `400 ${Math.round(instFontPx)}px ${fontBase}`;
  const measureIng  = fontsReady ? makeMeasure(ingFontSpec,  innerW) : undefined;
  const measureInst = fontsReady ? makeMeasure(instFontSpec, innerW) : undefined;
  // 2-col column width mirrors renderer: flex gap = clamp(6px,1.2vw,12px), two flex-1 children.
  const colGapPx       = Math.max(6, Math.min(12, vwPx * 0.012));
  const measureIng2Col = fontsReady
    ? makeMeasure(ingFontSpec, Math.floor((innerW - colGapPx) / 2))
    : undefined;

  // ── Debug trace (visible in browser DevTools > Console) ──────────
  // Confirms canvas status, measurement values, and slot decisions.
  if (typeof window !== "undefined") {
    console.group(`%c📖 buildSlots  Build #${BUILD_NUMBER}`, "color:#c07834;font-weight:bold");
    console.log("canvas active:", fontsReady,
      "| viewport:", vwPx + "×" + vhPx,
      "| page:", pageW + "×" + pageH);
    console.log("fonts:", ingFontSpec);
    console.log("innerW:", innerW,
      "| charsPerLine(SSR fallback):", charsPerLine,
      "| ohMeta:", ohMeta.toFixed(1),
      "| lhIng:", lhIng.toFixed(2),
      "| lhInstEmbed:", lhInstEmbed.toFixed(2),
      "| ihEmbed:", ihEmbed.toFixed(1),
      "| contLinesInst:", contLinesInst);
    console.groupEnd();
  }

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

    // All ingredients go to recipe-ing slots; recipe-first is image-only.
    // When ≥5 items the renderer uses 2-col layout (2 items per row), so double
    // the row-count limits to get the correct item-count limits.
    const ingItemCount = (r.ingredients || "").split("\n").filter(l => l.trim()).length;
    const will2Col     = ingItemCount >= 5;
    const maxIngFirst  = will2Col ? contLinesIngFirst * 2 : contLinesIngFirst;
    const maxIngCont   = will2Col ? contLinesIngCont  * 2 : contLinesIngCont;
    const ingAllChunks = toChunks(r.ingredients || "", charsPerLine, maxIngFirst, maxIngCont, will2Col ? measureIng2Col : measureIng)
                           .filter(c => c.trim().length > 0);
    const fullInstText = instPlainText(r.instructions || "");
    const stepImages   = instStepImages(r.instructions || "");
    // YouTube URL: prefer top-level column, fall back to legacy instructions JSON
    const youtubeUrl   = r.youtube_url ?? instYoutubeLinks(r.instructions || "")[0]?.url ?? null;

    // Wrap measureInst to add imgRowCost rows for steps with images so
    // toChunks / splitText budget correctly for the rendered image height.
    const imageStepNums = new Set(stepImages.map(s => s.step));
    const measureInstImg: MeasureFn | undefined = imageStepNums.size === 0
      ? measureInst
      : (line: string) => {
          const rows = measureInst
            ? measureInst(line)
            : Math.max(1, Math.ceil((line.length || 0.1) / charsPerLine));
          const m = line.trim().match(/^(\d+)\./);
          const n = m ? parseInt(m[1]) : null;
          return rows + (n !== null && imageStepNums.has(n) ? imgRowCost : 0);
        };

    slots.push({ kind: "recipe-first", recipeIdx: ri, ingText: "" });

    // Track what instructions still need their own pages after embedding.
    let instOverflowText = fullInstText;
    let ytOnIngPage = false; // set to true if YouTube fits on the recipe-ing page

    // Embed the first portion of instructions on the ingredient page when:
    //   • ingredients fit on exactly one page (so there IS remaining vertical space)
    //   • there are instructions to show
    // Key difference from the old approach: we measure the actual remaining rows
    // using splitText(instAvail) so the embedded chunk NEVER overflows.
    if (ingAllChunks.length === 1 && fullInstText.trim()) {
      const ingItems = ingAllChunks[0].split("\n").filter(l => l.trim()).length;
      const ingRows  = ingItems >= 5
        ? Math.ceil(lineCount(ingAllChunks[0], charsPerLine, measureIng2Col) / 2)
        : lineCount(ingAllChunks[0], charsPerLine, measureIng);
      const instAvailPx = pageH - ohMeta - ingRows * lhIng - ihEmbed;
      const instAvail   = Math.max(0, Math.floor((instAvailPx + instGapEmbed) / lhInstEmbed) - 1);

      // Per-step row trace — shows exact canvas vs formula measurement per step
      if (typeof window !== "undefined") {
        const stepLines = fullInstText.split("\n").filter(l => l.trim());
        const stepRows  = stepLines.map(l => ({
          step: l.slice(0, 40),
          len:  l.length,
          rows: measureInst ? measureInst(l) : Math.max(1, Math.ceil(l.length / charsPerLine)),
          pxW:  fontsReady ? (() => { const c = canvasCtx(instFontSpec); return c ? Math.round(c.measureText(l).width) : "?" })() : "font-not-ready",
        }));
        console.group(`%c  📄 ${r.title || "recipe " + ri}`, "color:#555");
        console.log("ingItems:", ingItems, "| will2Col:", will2Col,
          "| canvas2Col:", !!measureIng2Col, "| colW:", Math.floor((innerW - colGapPx) / 2),
          "| ingRows:", ingRows, "| instAvailPx:", instAvailPx.toFixed(1),
          "| instAvail:", instAvail, "| contLinesInst:", contLinesInst);
        console.table(stepRows);
        console.groupEnd();
      }

      if (instAvail >= 2) {
        const [instEmbed, instRest] = splitText(fullInstText, charsPerLine, instAvail, measureInstImg);
        const allEmbedded = !instRest.trim();
        if (typeof window !== "undefined") {
          const embeddedCount = instEmbed.split("\n").filter(l => l.trim()).length;
          const restCount     = instRest.split("\n").filter(l => l.trim()).length;
          console.log(`  ↳ embed ${embeddedCount} steps, overflow ${restCount} steps → ${Math.ceil(restCount / contLinesInst)} inst page(s)`);
        }
        // When all instructions fit embedded, check if YouTube also fits on this page.
        if (allEmbedded && youtubeUrl) {
          const usedEmbedRows = lineCount(instEmbed, charsPerLine, measureInstImg);
          const ytNeededEmbed = ytRowCostEmbed + 2; // thumbnail rows + heading rows (embed scale)
          ytOnIngPage = usedEmbedRows + ytNeededEmbed <= instAvail;
          if (typeof window !== "undefined")
            console.log(`  ↳ yt-ing: usedEmbed=${usedEmbedRows} ytNeeded=${ytNeededEmbed} instAvail=${instAvail} → ${ytOnIngPage ? "append-ing" : "needs-own-page"}`);
        }
        slots.push({
          kind: "recipe-ing", recipeIdx: ri, chunkIdx: 0, ingText: ingAllChunks[0],
          instFirstChunk: instEmbed,
          ...(stepImages.length > 0 ? { instFirstStepImages: stepImages } : {}),
          ...(ytOnIngPage ? { youtubeUrl: youtubeUrl! } : {}),
        });
        instOverflowText = instRest;
      } else {
        if (typeof window !== "undefined")
          console.log(`  ↳ instAvail=${instAvail} < 2 → no embed, all ${fullInstText.split("\n").filter(l=>l.trim()).length} steps go to pure pages`);
        slots.push({ kind: "recipe-ing", recipeIdx: ri, chunkIdx: 0, ingText: ingAllChunks[0] });
      }
    } else {
      for (let ci = 0; ci < ingAllChunks.length; ci++)
        slots.push({ kind: "recipe-ing", recipeIdx: ri, chunkIdx: ci, ingText: ingAllChunks[ci] });
    }

    // Paginate instructions that didn't fit on the ingredient page
    const instChunks = instOverflowText.trim()
      ? toChunks(instOverflowText, charsPerLine, contLinesInst, contLinesInst, measureInstImg).filter(c => c.trim().length > 0)
      : [];

    // ── Phase 2: YouTube placement (AFTER instruction pagination is complete) ──────
    // Never modifies instChunks — instructions are paginated exactly as before.
    // Measure rows used on the final instruction page, then decide:
    //   • enough room → attach youtubeUrl to that slot
    //   • not enough room OR no instruction pages → dedicated recipe-youtube slot
    let ytOnLastPage = false;
    if (youtubeUrl && instChunks.length > 0) {
      const lastIdx   = instChunks.length - 1;
      const usedRows  = lineCount(instChunks[lastIdx], charsPerLine, measureInstImg);
      const ytNeeded  = ytRowCost + 2; // thumbnail rows + "Video Reference" heading rows
      ytOnLastPage    = usedRows + ytNeeded <= contLinesInst;
      if (typeof window !== "undefined")
        console.log(`  ↳ yt: lastPage usedRows=${usedRows} ytNeeded=${ytNeeded} contLines=${contLinesInst} → ${ytOnLastPage ? "append" : "new page"}`);
    }

    for (let ci = 0; ci < instChunks.length; ci++)
      slots.push({
        kind: "recipe-inst", recipeIdx: ri, chunkIdx: ci, instText: instChunks[ci],
        ...(ci === instChunks.length - 1 && ytOnLastPage ? { youtubeUrl: youtubeUrl! } : {}),
        ...(stepImages.length > 0 ? { stepImages } : {}),
        ...(ci === 0 && ingAllChunks.length === 0 ? { showMeta: true } : {}),
      });

    // Dedicated YouTube page: only when it doesn't fit on last inst page AND not on ing page
    if (youtubeUrl && !ytOnLastPage && !ytOnIngPage) {
      slots.push({ kind: "recipe-youtube", recipeIdx: ri, youtubeUrl: youtubeUrl as string });
    }

    // Debug: verify exactly one YouTube block per recipe
    if (typeof window !== "undefined" && youtubeUrl) {
      const ytBlocks = slots.filter(s =>
        ((s.kind === "recipe-inst" && (s as any).recipeIdx === ri && (s as any).youtubeUrl)) ||
        ((s.kind === "recipe-ing"  && (s as any).recipeIdx === ri && (s as any).youtubeUrl)) ||
        (s.kind === "recipe-youtube" && s.recipeIdx === ri)
      );
      const flag = ytBlocks.length !== 1 ? " ⚠ WRONG COUNT!" : "";
      const placement = ytOnLastPage ? "last-inst-page" : ytOnIngPage ? "ing-page" : "dedicated-page";
      console.log(
        `%c  🎬 ${r.title} — youtube blocks: ${ytBlocks.length}${flag}` +
        ` | placement: ${placement}` +
        ` | inst pages: ${instChunks.length}`,
        ytBlocks.length !== 1 ? "color:red;font-weight:bold" : "color:#888",
      );
    }

    // Watermark for spread alignment — skip in portrait.
    if (!portrait) {
      const ytSlotCount = youtubeUrl && !ytOnLastPage && !ytOnIngPage ? 1 : 0;
      const total = 1 + ingAllChunks.length + instChunks.length + ytSlotCount;
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
      style={{ fontSize: "clamp(9px,2vmin,14px)", fontFamily: "Georgia,'Times New Roman',serif" }}
    >
      by {label}
    </button>
  );
}

// ─── Page components ──────────────────────────────────────────────
const PageCoverFront = forwardRef<HTMLDivElement, { book: Book; publicCount: number; authorName?: string; onAuthorClick?: () => void; lastUpdated?: string }>(({ book, publicCount, authorName, onAuthorClick, lastUpdated }, ref) => {
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
            <div className="border border-white/22 text-center text-white flex flex-col items-center justify-center w-full"
                 style={{ padding: "clamp(1.5rem,8%,3rem) clamp(12px,3%,20px)", gap: "clamp(4px,1vmin,10px)" }}>
              <p className="tracking-[.38em] text-white/48 uppercase truncate w-full"
                 style={{ fontSize: "clamp(8px,1.8vmin,14px)" }}>
                {book.tagline ?? "ตำรับอาหาร"}
              </p>
              <div className="w-1/3 h-px bg-white/20" />
              <h2 className="font-bold leading-tight break-words w-full"
                  style={{ fontSize: "clamp(1.5rem,6.5vmin,3rem)", fontFamily: "'Playfair Display','Thonburi',Georgia,serif" }}>
                {book.title}
              </h2>
              {book.subtitle && (<>
                <div className="h-px bg-white/20" style={{ width: "clamp(24px,6%,48px)" }} />
                <p className="text-white/65 leading-snug"
                   style={{ fontSize: "clamp(10px,2vmin,15px)" }}>{book.subtitle}</p>
              </>)}
            </div>

            {/* Author — directly below the title frame, left-aligned */}
            {authorName && (
              <div className="px-1" style={{ marginTop: "clamp(4px,1vmin,10px)" }}>
                {onAuthorClick
                  ? <AuthorClickButton label={authorName} onClick={onAuthorClick} />
                  : <p className="text-white/50 italic tracking-widest"
                       style={{ fontSize: "clamp(9px,2vmin,14px)", fontFamily: "Georgia,'Times New Roman',serif" }}>
                      by {authorName}
                    </p>
                }
              </div>
            )}

            {/* Book timestamp — below author, mono metadata */}
            <p title="Last updated"
               className="px-1 text-white/30 tracking-wide"
               style={{ marginTop: "clamp(2px,0.4vmin,5px)", fontSize: "clamp(6px,1.2vw,9px)", fontFamily: "var(--font-jetbrains,'JetBrains Mono',monospace)" }}>
              {new Date(lastUpdated ?? book.updated_at ?? book.created_at).toLocaleString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
      {publicCount > 0 && (
        <div className="absolute z-10 pointer-events-none whitespace-nowrap"
             style={{ bottom: 44, right: 5, background: "rgba(255,255,255,0.95)", color: C,
               fontSize: 11, padding: "4px 12px", borderRadius: 9999,
               display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
          <Globe style={{ width: 14, height: 14 }} /> Shared {publicCount}
        </div>
      )}
    </div>
  );
});
PageCoverFront.displayName = "PageCoverFront";

const PageInsideCover = forwardRef<HTMLDivElement, object>((_p, ref) => (
  <div ref={ref} data-density="hard">
    <div className="w-full h-full book-paper" style={{ boxShadow: PAGE_BORDER, borderRadius: 2 }} />
  </div>
));
PageInsideCover.displayName = "PageInsideCover";

const PageToC = forwardRef<
  HTMLDivElement,
  { recipes: Recipe[]; tocPage: number; itemsPerPage: number; recipeSlotMap: number[]; onNavigate: (pageIdx: number) => void; coverColor: string; density: "soft" | "hard" }
>(({ recipes, tocPage, itemsPerPage, recipeSlotMap, onNavigate, coverColor, density }, ref) => {
  const { t } = useLocale();
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
      <div className="w-full h-full book-paper flex flex-col relative"
           style={{ padding: "clamp(20px,2.5vw,40px)", boxShadow: PAGE_BORDER, borderRadius: 2 }}>
        <Tape />
        <p className="tracking-[.38em] uppercase font-semibold"
           style={{ fontSize: "clamp(8px,1.4vmin,11px)", marginTop: "clamp(8px,1.8vmin,20px)", marginBottom: "clamp(3px,0.5vmin,7px)", color: "var(--book-ink-2)" }}>
          {isCont ? t.library.tocCont : t.library.toc}
        </p>
        <h2 className="font-bold leading-tight"
            style={{ fontSize: "clamp(16px,3.5vmin,28px)", marginBottom: "clamp(8px,1.8vmin,20px)", color: "var(--book-ink)" }}>
          {isCont ? t.library.tocCont : t.library.toc}
        </h2>
        <nav ref={navRef} className="flex-1 flex flex-col overflow-hidden"
             style={{ gap: "clamp(1px,0.2vmin,3px)" }}>
          {recipes.length === 0
            ? <p className="text-sm italic" style={{ color: "var(--book-ink-2)" }}>{t.library.noRecipes}</p>
            : pageRecipes.map((r, localIdx) => {
                const ri      = start + localIdx;
                const slotIdx = recipeSlotMap[ri] ?? 0;
                return (
                  <button
                    key={r.id}
                    onClick={() => onNavigate(slotIdx)}
                    className="w-full flex items-center gap-1 px-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 active:bg-amber-100 dark:active:bg-amber-950/30 transition-colors text-left"
                    style={{ fontSize: "clamp(11px,2.2vmin,15px)", paddingTop: "clamp(4px,0.9vmin,7px)", paddingBottom: "clamp(4px,0.9vmin,7px)" }}
                  >
                    <span className="shrink-0 truncate max-w-[55%]" style={{ color: "var(--book-ink)" }}>{r.title}</span>
                    {r.is_public && <ShareBadge coverColor={coverColor} />}
                    <span className="border-b border-dotted border-stone-300 dark:border-stone-600 flex-1 mx-2" />
                    <span className="shrink-0 font-mono"
                          style={{ fontSize: "clamp(9px,1.3vmin,11px)", color: "var(--book-ink-2)" }}>
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
      <span className="leading-snug" style={{ fontSize: "clamp(11px,1.8vmin,16px)", color: "var(--book-ink)" }}>{text}</span>
    </div>
  );
}

// ─── Section heading with gold gradient rule ──────────────────────
function PageSectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="shrink-0 font-bold"
            style={{ fontFamily: "var(--font-playfair,'Playfair Display',Georgia,serif)", fontSize: "clamp(15px,3vmin,28px)", color: "var(--book-ink)" }}>
        {children}
      </span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right,#d4af37 0%,rgba(212,175,55,0.15) 70%,transparent 100%)" }} />
    </div>
  );
}

// ─── Instruction step row (shared by inst page + combined ing/inst page) ─────
function InstructionStep({ line, fallbackNum, stepImage }: { line: string; fallbackNum?: number; stepImage?: string }) {
  const m    = line.trim().match(/^(\d+)\.\s*(.*)/);
  const num  = m?.[1] ?? (fallbackNum != null ? String(fallbackNum) : undefined);
  const body = m?.[2] ?? line.trim();
  return (
    <div className="min-w-0">
      <div className="flex items-baseline min-w-0" style={{ gap: "clamp(5px,1vw,10px)" }}>
        {num && (
          <span className="shrink-0 select-none pointer-events-none"
                style={{ fontFamily: "var(--font-playfair,'Playfair Display',Georgia,serif)", fontStyle: "italic", fontSize: "clamp(15px,2.9vw,25px)", color: "#d4af37", opacity: 0.55, lineHeight: 1 }}>
            {num}
          </span>
        )}
        <span className="flex-1 leading-relaxed" style={{ fontSize: "clamp(11px,1.8vmin,16px)", color: "var(--book-ink)" }}>
          {body}
        </span>
      </div>
      {stepImage && (
        <div style={{ marginTop: "clamp(3px,0.5vw,5px)", marginLeft: "clamp(18px,2.8vw,30px)", flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stepImage} alt="" style={{
            display: "block",
            maxWidth: "100%",
            maxHeight: "clamp(80px,20vmin,200px)",
            width: "auto",
            height: "auto",
            borderRadius: 4,
          }} />
        </div>
      )}
    </div>
  );
}

function ytVideoId(url: string): string | null {
  if (!url?.trim()) return null;
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([^?&\s]{11})/);
  return m?.[1] ?? null;
}

// ─── YouTube full-width block — appears after instructions ────────
function YoutubeBlock({ url, onPlay }: { url?: string | null; onPlay?: (url: string) => void }) {
  // Must be before early return to satisfy rules of hooks
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    const stop = (e: Event) => { e.stopPropagation(); };
    el.addEventListener("mousedown", stop);
    el.addEventListener("touchstart", stop, { passive: true });
    return () => {
      el.removeEventListener("mousedown", stop);
      el.removeEventListener("touchstart", stop);
    };
  });
  if (!url) return null;
  const vid = ytVideoId(url);
  return (
    <div className="shrink-0" style={{ marginTop: "clamp(4px,0.8vw,8px)", display: "flex", justifyContent: "center" }}>
      <button
        ref={btnRef}
        type="button"
        onClick={e => {
          e.stopPropagation();
          if (onPlay) onPlay(url);
          else window.open(url, "_blank", "noopener,noreferrer");
        }}
        className="relative overflow-hidden"
        style={{
          display: "block",
          aspectRatio: "16/9",
          width: "min(100%, calc(clamp(80px,20vmin,200px) * 16 / 9))",
          cursor: "pointer", border: "none", padding: 0, background: "#111",
          borderRadius: "clamp(4px,0.8vmin,8px)",
        }}
      >
        {vid && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`} alt=""
            draggable={false}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            background: "rgba(220,0,0,0.92)", borderRadius: 5,
            width: "clamp(28px,7vmin,52px)", height: "clamp(20px,5vmin,36px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 0, height: 0, borderTop: "clamp(8px,2vmin,13px) solid transparent", borderBottom: "clamp(8px,2vmin,13px) solid transparent", borderLeft: "clamp(14px,3.5vmin,22px) solid white", marginLeft: 3 }} />
          </div>
        </div>
      </button>
    </div>
  );
}

// ─── Left recipe cover page — full-bleed editorial image ──────────
const PageRecipeFirst = forwardRef<
  HTMLDivElement,
  { recipe: Recipe; ingText: string; pn: number; coverColor: string; density: "soft" | "hard" }
>(({ recipe: r, pn, coverColor, density }, ref) => {
  const { t }        = useLocale();
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
             style={{ padding: "clamp(12px,2.5vmin,26px)", paddingBottom: "clamp(14px,2.8vmin,28px)" }}>

          <div className="flex items-center flex-wrap mb-[clamp(10px,3.5vmin,40px)]" style={{ gap: "clamp(4px,0.8vw,8px)" }}>
            <span className="uppercase"
                  style={{ fontFamily: "var(--font-jetbrains,'JetBrains Mono',monospace)", fontSize: "clamp(11px,2.5vmin,17px)", color: "#ffbf00", letterSpacing: "0.3em", opacity: 0.9, textShadow: "0px 0px 5px rgb(0,0,0)" }}>
              {[r.category, r.cook_time_minutes ? `${r.cook_time_minutes} ${t.recipe.minutes}` : null]
                .filter(Boolean).join("  ·  ") || "Recipe"}
            </span>
            {r.is_public && <ShareBadge coverColor={coverColor} solid />}
          </div>

          <h2 className="font-black leading-[1.28]"
              style={{ fontSize: "clamp(1.6rem,6.5vmin,3.6rem)", textShadow: "1px 3px 14px rgba(0,0,0,0.65)", letterSpacing: "-0.01em" }}>
            {r.title}
          </h2>

          {r.description && (
            <p className="mt-[clamp(8px,2.2vmin,24px)] leading-snug text-white/65 font-light"
               style={{ fontSize: "clamp(11px,2.2vmin,18px)", maxWidth: "92%",
                        display: "-webkit-box", WebkitLineClamp: 10,
                        WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {r.description}
            </p>
          )}

          {/* Gold rule + timestamp on the same row */}
          <div className="mt-[clamp(6px,1.2vw,12px)] flex items-center min-w-0"
               style={{ gap: "clamp(6px,1vw,10px)" }}>
            <div className="shrink-0"
                 style={{ width: "clamp(20px,4vw,36px)", height: 1, background: "rgba(255,191,0,0.55)" }} />
            <p title="Last updated"
               className="text-white/40 tracking-wide truncate min-w-0"
               style={{ fontSize: "clamp(7px,1.1vw,10px)", fontFamily: "var(--font-jetbrains,'JetBrains Mono',monospace)" }}>
              {new Date(r.updated_at ?? r.created_at).toLocaleString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit", second: "2-digit",
              }).replace(", ", " · ")}
            </p>
          </div>

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
  { recipe: Recipe; label: string; text: string; lh: string; isRight: boolean; pn: number; density: "soft" | "hard"; youtubeUrl?: string; stepImages?: { step: number; url: string }[]; variant?: "ing" | "inst"; showMeta?: boolean; showRibbon?: boolean; instFirstChunk?: string; instFirstStepImages?: { step: number; url: string }[]; onPlayVideo?: (url: string) => void }
>(({ recipe: r, text, isRight, pn, density, youtubeUrl, stepImages, variant = "ing", showMeta = false, showRibbon = false, instFirstChunk, instFirstStepImages, onPlayVideo }, ref) => {
  const { t }     = useLocale();
  const ingLines  = variant === "ing"  ? text.split("\n").filter(l => l.trim()) : [];
  const instLines = variant === "inst" ? text.split("\n").filter(l => l.trim()) : [];
  const half      = Math.ceil(ingLines.length / 2);
  const use2Col   = ingLines.length >= 5;
  const colA      = use2Col ? ingLines.slice(0, half) : ingLines;
  const colB      = use2Col ? ingLines.slice(half)    : [];

  return (
    <div ref={ref} data-density={density}>
      <div className="w-full h-full flex flex-col relative overflow-hidden book-paper"
           style={{ boxShadow: PAGE_BORDER, borderRadius: 2, padding: "clamp(12px,2vmin,22px)" }}>

        {/* Bookmark ribbon — first right page of recipe only */}
        {showRibbon && (
          <div className="absolute top-0 z-10"
               style={{
                 [isRight ? "right" : "left"]: "clamp(8px,1.8vmin,16px)",
                 width:  "clamp(14px,2.6vmin,22px)",
                 height: "clamp(36px,7vmin,60px)",
                 background: "linear-gradient(160deg,#c0392b 0%,#8e1c12 100%)",
                 clipPath: "polygon(0 0,100% 0,100% 100%,50% 87%,0 100%)",
                 boxShadow: "1px 2px 6px rgba(0,0,0,0.28)",
               }} />
        )}

        {/* ── Meta grid (first page only) ─────────────────── */}
        {showMeta && (
          <>
            <div className="grid grid-cols-3 mt-3 mb-3 shrink-0" style={{ gap: "clamp(4px,1.2vmin,10px)" }}>
              {([
                { lbl: "CATEGORY", val: r.category ?? "—" },
                { lbl: "PREP",     val: r.cook_time_minutes ? `${r.cook_time_minutes} ${t.recipe.minutes}` : "—" },
                { lbl: "SERVINGS", val: r.servings ? `${r.servings} ${t.recipe.servings}` : "—" },
              ] as const).map(({ lbl, val }) => (
                <div key={lbl} className="flex flex-col items-center text-center" style={{ gap: "clamp(1px,0.3vw,3px)" }}>
                  <span className="uppercase text-stone-400 dark:text-stone-500"
                        style={{ fontFamily: "var(--font-jetbrains,'JetBrains Mono',monospace)", fontSize: "clamp(10px,2vmin,18px)", letterSpacing: "0.22em" }}>
                    {lbl}
                  </span>
                  <span className="font-bold leading-tight"
                        style={{ fontSize: "clamp(9px,1.8vmin,16px)", color: "var(--book-ink)" }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-px bg-stone-200 dark:bg-stone-700 mb-3 shrink-0" />
          </>
        )}

        {/* Spacer when no meta */}
        {!showMeta && <div className="shrink-0" style={{ height: "clamp(12px,3vmin,28px)" }} />}

        {/* Recipe name breadcrumb */}
        <p className="truncate mb-[clamp(3px,0.7vw,6px)] shrink-0 uppercase"
           style={{ fontFamily: "var(--font-jetbrains,'JetBrains Mono',monospace)", fontSize: "clamp(8px,1.4vmin,12px)", color: "#c4a46e", letterSpacing: "0.25em" }}>
          {r.title}
        </p>

        {/* Section heading */}
        <div className="mb-[clamp(5px,1vw,9px)] shrink-0">
          <PageSectionHead>{variant === "ing" ? t.recipe.ingredientsLabel : t.recipe.instructionsLabel}</PageSectionHead>
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
              <PageSectionHead>{t.recipe.instructionsLabel}</PageSectionHead>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col" style={{ gap: "clamp(4px,0.8vw,8px)" }}>
              {instFirstChunk.split("\n").filter(l => l.trim()).map((line, i) => {
                const m = line.trim().match(/^(\d+)\./);
                const n = m ? parseInt(m[1]) : null;
                const img = n !== null ? (instFirstStepImages ?? []).find(s => s.step === n)?.url : undefined;
                return <InstructionStep key={i} line={line} fallbackNum={i + 1} stepImage={img} />;
              })}
              {youtubeUrl && (
                <>
                  <div className="shrink-0" style={{ marginTop: "clamp(4px,0.8vw,8px)" }}>
                    <PageSectionHead>{t.library.videoRef}</PageSectionHead>
                  </div>
                  <YoutubeBlock url={youtubeUrl} onPlay={onPlayVideo} />
                </>
              )}
            </div>
          </>
        )}

        {/* ── Instructions ─────────────────────────────────── */}
        {variant === "inst" && (
          <div className="flex-1 overflow-hidden flex flex-col" style={{ gap: "clamp(5px,1vw,10px)" }}>
            {instLines.map((line, i) => {
              const m = line.trim().match(/^(\d+)\./);
              const n = m ? parseInt(m[1]) : null;
              const img = n !== null ? (stepImages ?? []).find(s => s.step === n)?.url : undefined;
              return <InstructionStep key={i} line={line} fallbackNum={i + 1} stepImage={img} />;
            })}
            {youtubeUrl && (
              <>
                <div className="shrink-0" style={{ marginTop: "clamp(4px,0.8vw,8px)" }}>
                  <PageSectionHead>Video Reference</PageSectionHead>
                </div>
                <YoutubeBlock url={youtubeUrl} onPlay={onPlayVideo} />
              </>
            )}
          </div>
        )}

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
      <div className="w-full h-full flex items-center justify-center relative overflow-hidden book-paper"
           style={{ boxShadow: PAGE_BORDER, borderRadius: 2 }}>
        <div className="text-center select-none pointer-events-none px-8"
             style={{ opacity: 0.07, transform: "rotate(-10deg)" }}>
          <p className="font-black break-words leading-tight"
             style={{ fontFamily: "var(--font-playfair,'Playfair Display',Georgia,serif)", fontSize: "clamp(1.4rem,5.5vw,3rem)", color: "var(--book-ink)" }}>
            {r.title}
          </p>
        </div>
      </div>
    </div>
  )
);
PageRecipeWatermark.displayName = "PageRecipeWatermark";

// ─── Dedicated YouTube page — appears when video block doesn't fit on last inst page ──
const PageRecipeYoutube = forwardRef<
  HTMLDivElement,
  { recipe: Recipe; youtubeUrl: string; isRight: boolean; pn: number; density: "soft" | "hard"; onPlayVideo?: (url: string) => void }
>(({ recipe: r, youtubeUrl, isRight, pn, density, onPlayVideo }, ref) => {
  const { t } = useLocale();
  return (
    <div ref={ref} data-density={density}>
      <div className="w-full h-full flex flex-col relative overflow-hidden book-paper"
           style={{ boxShadow: PAGE_BORDER, borderRadius: 2, padding: "clamp(12px,2vmin,22px)" }}>
        <div className="shrink-0" style={{ height: "clamp(12px,3vmin,28px)" }} />
        <p className="truncate mb-[clamp(3px,0.7vw,6px)] shrink-0 uppercase"
           style={{ fontFamily: "var(--font-jetbrains,'JetBrains Mono',monospace)", fontSize: "clamp(8px,1.4vmin,12px)", color: "#c4a46e", letterSpacing: "0.25em" }}>
          {r.title}
        </p>
        <div className="mb-[clamp(5px,1vw,9px)] shrink-0">
          <PageSectionHead>{t.library.videoRef}</PageSectionHead>
        </div>
        <YoutubeBlock url={youtubeUrl} onPlay={onPlayVideo} />
        <Pn n={pn} right={isRight} />
      </div>
    </div>
  );
});
PageRecipeYoutube.displayName = "PageRecipeYoutube";

const PageFiller = forwardRef<HTMLDivElement, { density: "soft" | "hard" }>(({ density }, ref) => {
  const { t } = useLocale();
  return (
    <div ref={ref} data-density={density}>
      <div className="w-full h-full book-paper flex items-center justify-center"
           style={{ boxShadow: PAGE_BORDER, borderRadius: 2 }}>
        <div className="text-center select-none pointer-events-none">
          <div className="w-12 h-px bg-stone-200 dark:bg-stone-700 mx-auto mb-3" />
          <p className="text-[9px] tracking-[.32em] text-stone-300 dark:text-stone-600 uppercase">{t.library.recipeWatermark}</p>
          <div className="w-12 h-px bg-stone-200 dark:bg-stone-700 mx-auto mt-3" />
        </div>
      </div>
    </div>
  );
});
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
function TocSortModal({ recipes, open, onClose, onSave, coverColor, t }: {
  recipes: Recipe[];
  open: boolean;
  onClose: () => void;
  onSave: (sorted: Recipe[]) => Promise<void>;
  coverColor: string;
  t: Dict;
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
    <Modal open={open} onClose={onClose} title={t.library.sortRecipes} disableBackdropClick>
      <div className="bg-surface rounded-b-2xl border border-border border-t-0 p-4 sm:p-5">
        <p className="text-xs text-muted mb-3">{t.library.sortHint}</p>
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
                className="flex items-center gap-2 px-2 py-2 rounded-xl border border-transparent hover:bg-elevated hover:border-border transition-colors select-none"
              >
                <GripVertical className="toc-drag-handle w-4 h-4 text-muted shrink-0 cursor-grab active:cursor-grabbing" />
                <span className="w-5 text-center text-xs text-muted font-mono shrink-0">{i + 1}</span>
                <span className="flex-1 text-sm text-secondary truncate">{r.title}</span>
                {r.is_public && <ShareBadge coverColor={coverColor} />}
                {r.category && (
                  <span className="text-[10px] text-muted shrink-0 hidden sm:block">{r.category}</span>
                )}
                <div className="flex gap-0.5 shrink-0">
                  <button onClick={() => move(i, -1)} disabled={i === 0}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-elevated disabled:opacity-20 text-secondary transition-colors">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === sorted.length - 1}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-elevated disabled:opacity-20 text-secondary transition-colors">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </ReactSortable>
        </div>
        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-border">
          <button onClick={onClose}
                  className="px-4 py-2 text-sm text-secondary hover:bg-elevated rounded-xl transition-colors">
            {t.common.cancel}
          </button>
          <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 text-sm bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1.5 transition-colors">
            {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> {t.common.saving}</> : t.common.save}
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
  const { t } = useLocale();
  const bookRef = useRef<any>(null);
  const fabRef  = useRef<HTMLDivElement>(null);
  const { pageW, pageH, portrait, ready, vwPx, vhPx } = usePageDimensions();

  const [book,    setBook]    = useState<Book | null>(null);
  const [recipes,    setRecipes]    = useState<Recipe[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [dataVersion, setDataVersion] = useState(0);
  const [flipType,    setFlipType]    = useState<"soft" | "hard">("soft");
  const [authorName,  setAuthorName]  = useState("");
  const [writerInfo,       setWriterInfo]       = useState<WriterInfo | null>(null);
  const [writerStatsLoading, setWriterStatsLoading] = useState(false);
  const [writerCardOpen, setWriterCardOpen] = useState(false);
  const [fontsReady,    setFontsReady]    = useState(false);

  useEffect(() => {
    const v = localStorage.getItem("rv_page_flip_type");
    if (v === "hard" || v === "soft") setFlipType(v);
  }, []);

  useEffect(() => {
    // document.fonts.load() guarantees this specific font is rendered — not just
    // "font loading is done" (ready can resolve with fallback still active).
    Promise.all([
      document.fonts.load("400 11px 'IBM Plex Sans Thai'"),
      document.fonts.load("400 16px 'IBM Plex Sans Thai'"),
    ]).then(() => setFontsReady(true)).catch(() => setFontsReady(true));
  }, []);

  // Page tracking
  const [currentPage, setCurrentPage] = useState(0);

  // FAB
  const [fabOpen,         setFabOpen]         = useState(false);
  const [newRecipeOpen,   setNewRecipeOpen]   = useState(false);
  const [editRecipeOpen,  setEditRecipeOpen]  = useState(false);
  const [coverEditorOpen, setCoverEditorOpen] = useState(false);
  const [tocSortOpen,     setTocSortOpen]     = useState(false);
  const [ytModal,         setYtModal]         = useState<string | null>(null);

  // Register YouTube modal in the ESC stack so it intercepts ESC before the book modal
  useEffect(() => {
    if (!ytModal) return;
    const id = pushModal(() => setYtModal(null));
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isTopModal(id)) { e.preventDefault(); setYtModal(null); }
    }
    document.addEventListener("keydown", onKey);
    return () => { popModal(id); document.removeEventListener("keydown", onKey); };
  }, [ytModal]);

  // ── Fetch ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const sb = createClient();
    let recipeQ = sb.from("recipes").select("*").eq("book_id", bookId)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
    if (!isOwner) recipeQ = recipeQ.eq("is_public", true);
    const [bk, rc] = await Promise.all([
      sb.from("books").select("*, users(display_name, bio, avatar, role)").eq("id", bookId).single(),
      recipeQ.returns<Recipe[]>(),
    ]);
    if (bk.data) {
      setBook(bk.data as Book);
      const u = (bk.data as any).users;
      setAuthorName(u?.display_name ?? "");
      if (u) {
        setWriterInfo({ display_name: u.display_name ?? null, bio: u.bio ?? null, avatar: u.avatar ?? null, role: u.role ?? undefined });
        setWriterStatsLoading(true);
        // Fire-and-forget: enrich writer card with author stats after main load
        const authorId: string = (bk.data as any).user_id;
        void (async () => {
          try {
            const sc = createClient();
            const { data: authorBooks } = await sc.from("books").select("id").eq("user_id", authorId);
            const bkIds = (authorBooks ?? []).map((b: { id: string }) => b.id);
            const [recipeRes, publicRes] = bkIds.length
              ? await Promise.all([
                  sc.from("recipes").select("id", { count: "exact", head: true }).in("book_id", bkIds),
                  sc.from("recipes").select("id", { count: "exact", head: true }).in("book_id", bkIds).eq("is_public", true),
                ])
              : [{ count: 0 }, { count: 0 }];
            setWriterInfo(prev => prev ? {
              ...prev,
              book_count: bkIds.length,
              recipe_count: recipeRes.count ?? 0,
              public_count: publicRes.count ?? 0,
            } : null);
          } catch {}
          setWriterStatsLoading(false);
        })();
      }
    }
    if (rc.data) setRecipes(rc.data);
    setLoading(false);
  }, [bookId]);

  useEffect(() => { setLoading(true); fetchData(); }, [fetchData, dataVersion]);

  // ── Slot-based page layout ────────────────────────────────────────
  const { slots, recipeSlotMap, itemsPerPage } = useMemo(
    () => buildSlots(recipes, pageH, pageW, portrait, vwPx, vhPx, fontsReady),
    [recipes, pageH, pageW, portrait, vwPx, vhPx, fontsReady],
  );

  // Book freshness = MAX(book.updated_at, each recipe's own updated_at).
  // recipe.created_at is intentionally excluded: adding a new recipe is not an "edit".
  // recipe.updated_at is only non-null when that recipe's content was actually changed.
  // ISO strings compare lexicographically, so string reduce is correct for UTC timestamps.
  const bookLastUpdated = useMemo(() => {
    const ts: string[] = [];
    const bookTs = book?.updated_at ?? book?.created_at;
    if (bookTs) ts.push(bookTs);
    for (const r of recipes) {
      if (r.updated_at) ts.push(r.updated_at);
    }
    return ts.length ? ts.reduce((a, b) => (a > b ? a : b)) : undefined;
  }, [book, recipes]);

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
    currentSlot.kind === "recipe-first"   || currentSlot.kind === "recipe-ing" ||
    currentSlot.kind === "recipe-inst"    || currentSlot.kind === "recipe-wm"  ||
    currentSlot.kind === "recipe-youtube"
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
  if (!ready || loading || !book) return <SkeletonOpenBook pageW={pageW} pageH={pageH} portrait={portrait} />;

  const bookW   = portrait ? pageW : pageW * 2;
  const flipKey = `${flipType}:${portrait ? "p" : "l"}:${pageW}x${pageH}:${slots.length}:${dataVersion}`;

  const pages: React.ReactElement[] = slots.map((slot, si) => {
    // In portrait (single-page), all pages are visually "right pages" — the ribbon
    // and page number must always anchor to the right edge of the visible page.
    const isRight = portrait ? true : si % 2 === 0;
    switch (slot.kind) {
      case "cover-front":  return <PageCoverFront key="cf" book={book} publicCount={recipes.filter(r => r.is_public).length} authorName={authorName} onAuthorClick={writerInfo ? () => setWriterCardOpen(true) : undefined} lastUpdated={bookLastUpdated} />;
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
                        instFirstStepImages={slot.instFirstStepImages}
                        youtubeUrl={slot.youtubeUrl}
                        onPlayVideo={setYtModal} />
      );
      case "recipe-inst": return (
        <PageRecipeCont key={`rinst-${slot.recipeIdx}-${slot.chunkIdx}`}
                        recipe={recipes[slot.recipeIdx]}
                        label="" text={slot.instText} lh="1.6"
                        isRight={isRight} pn={si} density={flipType}
                        youtubeUrl={slot.youtubeUrl}
                        stepImages={slot.stepImages}
                        variant="inst" showMeta={slot.showMeta ?? false}
                        showRibbon={slot.chunkIdx === 0 && (slot.showMeta ?? false)}
                        onPlayVideo={setYtModal} />
      );
      case "recipe-wm": return (
        <PageRecipeWatermark key={`rw-${slot.recipeIdx}`}
                             recipe={recipes[slot.recipeIdx]} isRight={isRight} density={flipType} />
      );
      case "recipe-youtube": return (
        <PageRecipeYoutube key={`ryt-${slot.recipeIdx}`}
                           recipe={recipes[slot.recipeIdx]}
                           youtubeUrl={slot.youtubeUrl}
                           isRight={isRight} pn={si} density={flipType}
                           onPlayVideo={setYtModal} />
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
          onFlip={(e: any) => { setCurrentPage(e.data); setYtModal(null); }}
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
            <div ref={fabRef} className="anim-scale-in bg-surface rounded-2xl shadow-xl border border-border p-1.5 min-w-[13rem] flex flex-col gap-0.5">

              {/* owner-only actions */}
              {isOwner && (<>
                {/* เพิ่มสูตร — ทุก context */}
                <button onClick={() => { setFabOpen(false); setNewRecipeOpen(true); }}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary hover:bg-elevated rounded-xl">
                  <Plus className="w-4 h-4 text-muted" /> {t.library.addRecipe}
                </button>

                {/* แก้ไขปก — cover / backcover */}
                {(ctx === "cover" || ctx === "backcover") && (
                  <button onClick={() => { setFabOpen(false); setCoverEditorOpen(true); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary hover:bg-elevated rounded-xl">
                    <Palette className="w-4 h-4 text-muted" /> {t.library.editCover}
                  </button>
                )}

                {/* ดูการ์ดนักเขียน — cover */}
                {ctx === "cover" && writerInfo && (
                  <button onClick={() => { setFabOpen(false); setWriterCardOpen(true); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary hover:bg-elevated rounded-xl">
                    <User className="w-4 h-4 text-muted" /> {t.library.viewWriterCard}
                  </button>
                )}

                {/* แก้ไขสารบัญ — toc */}
                {ctx === "toc" && (
                  <button onClick={() => { setFabOpen(false); setTocSortOpen(true); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary hover:bg-elevated rounded-xl">
                    <List className="w-4 h-4 text-muted" /> {t.library.editToc}
                  </button>
                )}

                {/* แก้ไขสูตร — recipe */}
                {ctx === "recipe" && currentRecipe && (
                  <button onClick={() => { setFabOpen(false); setEditRecipeOpen(true); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary hover:bg-elevated rounded-xl">
                    <Edit2 className="w-4 h-4 text-muted" /> {t.library.editRecipe}
                  </button>
                )}

                {/* เปิดสารบัญ — cover / backcover / recipe */}
                {(ctx === "cover" || ctx === "backcover" || ctx === "recipe") && (
                  <button onClick={() => { setFabOpen(false); goToToC(); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary hover:bg-elevated rounded-xl">
                    <List className="w-4 h-4 text-muted" /> {t.library.openToc}
                  </button>
                )}

                {/* ปิดหนังสือ — cover / backcover */}
                {(ctx === "cover" || ctx === "backcover") && (
                  <button onClick={() => { setFabOpen(false); onClose(); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl">
                    <X className="w-4 h-4 text-red-400" /> {t.library.closeBook}
                  </button>
                )}

                <div className="border-t border-border my-0.5" />
              </>)}

              {/* ดูการ์ดนักเขียน — cover (non-owner) */}
              {!isOwner && ctx === "cover" && writerInfo && (
                <button onClick={() => { setFabOpen(false); setWriterCardOpen(true); }}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary hover:bg-elevated rounded-xl">
                  <User className="w-4 h-4 text-muted" /> {t.library.viewWriterCard}
                </button>
              )}

              {/* navigation — ทุก context ทุก role */}
              <button
                onClick={() => { setFabOpen(false); goToPrev(); }}
                disabled={currentPage === 0}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary hover:bg-elevated rounded-xl disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4 text-muted" /> {t.library.prevPage}
              </button>
              <button
                onClick={() => { setFabOpen(false); goToNext(); }}
                disabled={currentPage >= slots.length - 1}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary hover:bg-elevated rounded-xl disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4 text-muted" /> {t.library.nextPage}
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
      <Modal open={newRecipeOpen} onClose={() => setNewRecipeOpen(false)} title={t.library.addRecipe} disableBackdropClick>
        <RecipeForm bookId={bookId} inModal
          onSuccess={() => { setNewRecipeOpen(false); refreshAndReset(2); }}
          onCancel={() => setNewRecipeOpen(false)} />
      </Modal>

      {currentRecipe && (
        <Modal open={editRecipeOpen} onClose={() => setEditRecipeOpen(false)} title={t.library.editRecipeTitle} disableBackdropClick>
          <RecipeForm recipe={currentRecipe} bookId={bookId} inModal showDelete
            onSuccess={() => { setEditRecipeOpen(false); refreshAndReset(currentPage); }}
            onCancel={() => setEditRecipeOpen(false)}
            onDeleted={() => { setEditRecipeOpen(false); refreshAndReset(2); }} />
        </Modal>
      )}

      <Modal open={coverEditorOpen} onClose={() => setCoverEditorOpen(false)} title={t.library.editCoverTitle} maxWidth="max-w-3xl" disableBackdropClick>
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
        t={t}
      />

      {writerInfo && (
        <Modal open={writerCardOpen} onClose={() => setWriterCardOpen(false)} maxWidth="max-w-[30rem]">
          <div className="rounded-2xl overflow-hidden">
            <WriterCard info={writerInfo} statsLoading={writerStatsLoading} onClose={() => setWriterCardOpen(false)} />
          </div>
        </Modal>
      )}

      {/* ── YouTube in-book modal ──────────────────────────── */}
      {ytModal && (() => {
        const vid = ytVideoId(ytModal);
        const src = vid ? `https://www.youtube.com/embed/${vid}?rel=0&autoplay=1` : "";
        return (
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)" }}
            onMouseDown={() => setYtModal(null)}
          >
            <div
              className="relative"
              style={{ width: "min(90vw, 800px)", aspectRatio: "16/9" }}
              onMouseDown={e => e.stopPropagation()}
            >
              <button
                onClick={() => setYtModal(null)}
                className="absolute -top-8 right-0 text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors"
              >
                <X className="w-4 h-4" /> ปิด
              </button>
              {src && (
                <iframe
                  src={src}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded-xl border-0"
                />
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}
