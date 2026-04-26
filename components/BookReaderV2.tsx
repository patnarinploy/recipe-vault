"use client";

import HTMLFlipBook from "react-pageflip";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SkeletonOpenBook } from "./Skeleton";
import Modal from "./Modal";
import RecipeForm from "./RecipeForm";
import BookCoverEditor from "./BookCoverEditor";
import toast from "react-hot-toast";
import { Plus, Edit2, List, Palette, X, MoreHorizontal } from "lucide-react";
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

const PageToC = forwardRef<HTMLDivElement, { recipes: Recipe[] }>(({ recipes }, ref) => (
  <div ref={ref}>
    <div className="w-full h-full bg-[#fef9f0] flex flex-col relative"
         style={{ padding: "clamp(1.25rem,2.5vw,2.5rem)", boxShadow: PAGE_BORDER, borderRadius: 2 }}>
      <Tape />
      <p className="text-[9px] tracking-[.38em] text-[#8a7354] uppercase font-semibold mb-2 mt-1">
        Table of Contents
      </p>
      <h2 className="text-2xl font-bold text-stone-700 mb-5 leading-tight"
          style={{ fontFamily: "'Playfair Display','Thonburi',Georgia,serif" }}>
        สารบัญ
      </h2>
      <nav className="flex-1 space-y-1.5 overflow-hidden">
        {recipes.length === 0
          ? <p className="text-sm text-stone-400 italic">ยังไม่มีสูตรอาหาร</p>
          : recipes.map((r, i) => (
              <div key={r.id} className="flex items-center gap-1 px-2 py-2 text-sm">
                <span className="flex-1 text-stone-700 truncate">{r.title}</span>
                <span className="border-b border-dotted border-stone-300 w-10 shrink-0 mx-2" />
                <span className="shrink-0 text-[11px] font-mono text-stone-400">
                  {String(i * 2 + 1).padStart(2, "0")}
                </span>
              </div>
            ))
        }
      </nav>
    </div>
  </div>
));
PageToC.displayName = "PageToC";

const PageRecipeLeft = forwardRef<HTMLDivElement, { recipe: Recipe; pn: number }>(({ recipe: r, pn }, ref) => (
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
        {r.ingredients}
      </div>
      <Pn n={pn} />
    </div>
  </div>
));
PageRecipeLeft.displayName = "PageRecipeLeft";

const PageRecipeRight = forwardRef<HTMLDivElement, { recipe: Recipe; pn: number }>(({ recipe: r, pn }, ref) => (
  <div ref={ref}>
    <div className="w-full h-full bg-[#fef9f0] flex flex-col relative"
         style={{ padding: "clamp(1.25rem,2.5vw,2.5rem)", boxShadow: PAGE_BORDER, borderRadius: 2 }}>
      <Tape right />
      <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-3">วิธีทำ:</p>
      <div className="flex-1 overflow-hidden text-sm text-stone-600 leading-[1.95] whitespace-pre-line">
        {r.instructions}
      </div>
      <Pn n={pn} right />
    </div>
  </div>
));
PageRecipeRight.displayName = "PageRecipeRight";

const PageBackCover = forwardRef<HTMLDivElement, { book: Book }>(({ book }, ref) => (
  <div ref={ref} data-density="hard">
    <div className="w-full h-full flex items-center justify-center"
         style={{ background: book.cover_color, boxShadow: COVER_BORDER, borderRadius: 2 }}>
      <div className="w-8 h-px bg-white/20" />
    </div>
  </div>
));
PageBackCover.displayName = "PageBackCover";

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

  // ── Page context ──────────────────────────────────────────────────
  // pages layout: [cover(0), inside(1), toc(2), ...recipe pairs..., backcover(last)]
  const totalPages = 3 + recipes.length * 2 + 1; // cover+inside+toc + pairs + back
  const lastPage   = totalPages - 1;

  type Ctx = "cover" | "toc" | "recipe" | "backcover";
  let ctx: Ctx = "cover";
  if (currentPage === 0)                          ctx = "cover";
  else if (currentPage <= 2)                      ctx = "toc";
  else if (currentPage === lastPage)              ctx = "backcover";
  else                                            ctx = "recipe";

  const recipeIdx     = ctx === "recipe" ? Math.floor((currentPage - 3) / 2) : -1;
  const currentRecipe = recipeIdx >= 0 ? recipes[recipeIdx] ?? null : null;

  const goToToC = () => bookRef.current?.pageFlip().turnToPage(2);

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

  const pages: React.ReactElement[] = [
    <PageCoverFront key="cf" book={book} />,
    <PageInsideCover key="ic" />,
    <PageToC key="toc" recipes={recipes} />,
  ];
  recipes.forEach((r, i) => {
    pages.push(<PageRecipeLeft  key={`l${i}`} recipe={r} pn={i * 2 + 1} />);
    pages.push(<PageRecipeRight key={`r${i}`} recipe={r} pn={i * 2 + 2} />);
  });
  pages.push(<PageBackCover key="cb" book={book} />);

  return (
    <>
      <div className="font-apple" style={{ width: bookW, height: pageH }}>
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
      </div>

      {/* ── FAB (owner only) ─────────────────────────────────────── */}
      {isOwner && (
        <div className="fixed bottom-6 right-6 z-[10001] flex flex-col items-end gap-2">
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

              {/* แก้ไขสารบัญ — toc (logic ยังไม่ได้ทำ) */}
              {ctx === "toc" && (
                <button onClick={() => { setFabOpen(false); toast("แก้ไขสารบัญ — เร็วๆ นี้"); }}
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

          {/* FAB trigger */}
          <button onClick={() => setFabOpen(o => !o)} aria-label="เมนู"
                  className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all ${
                    fabOpen
                      ? "bg-stone-700 text-white rotate-90"
                      : "bg-orange-500 text-white hover:bg-orange-600 hover:scale-105"
                  }`}>
            {fabOpen ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
          </button>
        </div>
      )}

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
    </>
  );
}
