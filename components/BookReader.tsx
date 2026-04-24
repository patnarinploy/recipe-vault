"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChefHat, Users, ArrowLeft, Globe } from "lucide-react";
import type { Recipe, Book } from "@/lib/types";
import BookCover from "./BookCover";
import BookFAB from "./BookFAB";

function pg(n: number) { return String(n).padStart(2, "0"); }

const CAT_EN: Record<string, string> = {
  "อาหารไทย": "THAI FOOD", "อาหารจีน": "CHINESE", "อาหารญี่ปุ่น": "JAPANESE",
  "อาหารตะวันตก": "WESTERN", "อาหารอิตาลี": "ITALIAN", "อาหารอินเดีย": "INDIAN",
  "ของหวาน": "DESSERT", "เครื่องดื่ม": "DRINKS", "อื่นๆ": "OTHERS",
};

const FLIP_MS = 720;

function PageTape({ left }: { left?: boolean }) {
  return (
    <div className="absolute top-4 z-10 pointer-events-none rounded-sm"
      style={{
        width: 52, height: 18,
        [left ? "left" : "right"]: 20,
        background: "linear-gradient(90deg,rgba(212,184,150,.6),rgba(232,208,172,.7),rgba(212,184,150,.6))",
        transform: `rotate(${left ? -9 : 9}deg)`,
        boxShadow: "0 1px 3px rgba(0,0,0,.1)",
      }}
    />
  );
}

function PageNumber({ n, right }: { n: number; right?: boolean }) {
  return (
    <p className={`mt-auto pt-4 text-[11px] text-[#b8a48a] tracking-widest ${right ? "text-right" : "text-left"}`}
       style={{ fontFamily: "Georgia, serif" }}>
      {pg(n)}
    </p>
  );
}

function PageShareBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold ml-2 align-middle">
      <Globe className="w-2.5 h-2.5" /> แชร์แล้ว
    </span>
  );
}

// ─── ToC page ───────────────────────────────────────────────
function ToCPage({ recipes, onJump, isOwner }: {
  recipes: Recipe[]; onJump: (i: number) => void; isOwner: boolean;
}) {
  return (
    <div className="w-full h-full flex flex-col bg-[#fef9f0] p-6 md:p-10 relative">
      <PageTape left />
      <p className="text-[9px] tracking-[.38em] text-[#8a7354] uppercase font-semibold mb-2">Table of Contents</p>
      <h2 className="text-3xl font-bold text-stone-700 mb-6 leading-tight">สารบัญความอร่อย</h2>
      {recipes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-stone-300">
          <ChefHat className="w-14 h-14 mb-3" />
          <p className="text-sm">{isOwner ? "ยังไม่มีสูตรในเล่มนี้" : "หนังสือเล่มนี้ยังไม่มีสูตรสาธารณะ"}</p>
          {isOwner && <p className="text-xs mt-1">เริ่มเพิ่มสูตรแรกของคุณ</p>}
        </div>
      ) : (
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {recipes.map((r, i) => (
            <button
              key={r.id}
              onClick={() => onJump(i + 1)}
              className="w-full flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-amber-50 transition-colors group text-left"
            >
              <span className="flex-1 text-sm text-stone-600 group-hover:text-stone-800 truncate">
                {r.title}
                {r.is_public && <PageShareBadge />}
              </span>
              <span className="border-b border-dotted border-stone-300 w-10 shrink-0 mx-2" />
              <span className="shrink-0 text-[11px] text-stone-400 group-hover:text-[#8a7354] font-mono">
                หน้า {pg(i * 2 + 1)}
              </span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

// ─── Recipe left page ───────────────────────────────────────
function RecipeLeft({ recipe, pn }: { recipe: Recipe; pn: number }) {
  const catEn = recipe.category ? (CAT_EN[recipe.category] ?? recipe.category.toUpperCase()) : null;
  const meta = [catEn, recipe.cook_time_minutes ? `${recipe.cook_time_minutes} MINS` : null].filter(Boolean).join(" · ");
  return (
    <div className="w-full h-full flex flex-col bg-[#fef9f0] p-6 md:p-10 relative">
      <PageTape left />
      {meta && <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-1.5">{meta}</p>}
      <h2 className="text-2xl font-bold text-stone-800 leading-tight mb-3">
        {recipe.title}
        {recipe.is_public && <PageShareBadge />}
      </h2>
      <div className="h-px bg-[#e8d5b7] mb-5" />
      <div className="relative w-full shrink-0 rounded-md overflow-hidden mb-5 bg-amber-50 border border-amber-100"
        style={{ height: "clamp(140px, 26vh, 260px)" }}>
        {recipe.image_url
          ? <Image src={recipe.image_url} alt={recipe.title} fill className="object-cover" />
          : <div className="flex h-full items-center justify-center text-stone-200 text-xs tracking-widest"
              style={{ fontFamily: "Georgia,serif", fontStyle: "italic" }}>
              [ ภาพประกอบ ]
            </div>}
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-2">วัตถุดิบ:</p>
        <div className="text-sm text-stone-600 leading-[1.9] whitespace-pre-line overflow-hidden">
          {recipe.ingredients}
        </div>
      </div>
      <PageNumber n={pn} />
    </div>
  );
}

// ─── Recipe right page ──────────────────────────────────────
function RecipeRight({ recipe, pn }: { recipe: Recipe; pn: number }) {
  return (
    <div className="w-full h-full flex flex-col bg-[#fef9f0] p-6 md:p-10 relative">
      <PageTape />
      {recipe.description && (
        <p className="text-sm text-stone-500 italic mb-4 leading-relaxed"
           style={{ fontFamily: "Georgia, serif" }}>
          {recipe.description}
        </p>
      )}
      <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-2">วิธีทำ:</p>
      <div className="flex-1 overflow-hidden text-sm text-stone-600 leading-[1.95] whitespace-pre-line">
        {recipe.instructions}
      </div>
      {recipe.servings && (
        <div className="mt-3 pt-3 border-t border-[#e8d5b7] text-xs text-stone-400 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />{recipe.servings} ที่
        </div>
      )}
      <PageNumber n={pn} right />
    </div>
  );
}

function EmptyPage() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#fef9f0]">
      <ChefHat className="w-24 h-24 text-amber-100/80" />
    </div>
  );
}

// ─── Main BookReader ───────────────────────────────────────
interface Props {
  book: Book;
  recipes: Recipe[];
  isOwner: boolean;
  onClose?: () => void;
}

export default function BookReader({ book, recipes, isOwner, onClose }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<"cover" | "opening" | "book">("cover");
  const [spreadIdx, setSpreadIdx] = useState(0);
  const [flipping, setFlipping] = useState<"next" | "prev" | null>(null);
  const flipTimer = useRef<number | null>(null);

  const totalSpreads = 1 + recipes.length;
  const publicCount = useMemo(() => recipes.filter((r) => r.is_public).length, [recipes]);

  function renderLeft(idx: number) {
    if (idx < 0 || idx >= totalSpreads) return <EmptyPage />;
    if (idx === 0) return <ToCPage recipes={recipes} onJump={(i) => jumpTo(i)} isOwner={isOwner} />;
    const r = recipes[idx - 1];
    return <RecipeLeft recipe={r} pn={(idx - 1) * 2 + 1} />;
  }

  function renderRight(idx: number) {
    if (idx < 0 || idx >= totalSpreads) return <EmptyPage />;
    if (idx === 0) return <EmptyPage />;
    const r = recipes[idx - 1];
    return <RecipeRight recipe={r} pn={(idx - 1) * 2 + 2} />;
  }

  useEffect(() => () => {
    if (flipTimer.current) window.clearTimeout(flipTimer.current);
  }, []);

  function jumpTo(idx: number) {
    if (flipping) return;
    const clamped = Math.max(0, Math.min(idx, totalSpreads - 1));
    if (clamped === spreadIdx) return;
    // Multi-spread jumps skip animation; single-step uses flip
    if (Math.abs(clamped - spreadIdx) > 1) {
      setSpreadIdx(clamped);
      return;
    }
    const dir: "next" | "prev" = clamped > spreadIdx ? "next" : "prev";
    setFlipping(dir);
    flipTimer.current = window.setTimeout(() => {
      setSpreadIdx(clamped);
      setFlipping(null);
    }, FLIP_MS);
  }

  function next() {
    if (phase === "cover") {
      setPhase("opening");
      flipTimer.current = window.setTimeout(() => {
        setPhase("book");
        setSpreadIdx(0);
      }, 760);
      return;
    }
    if (flipping || phase !== "book") return;
    if (spreadIdx >= totalSpreads - 1) return;
    setFlipping("next");
    flipTimer.current = window.setTimeout(() => {
      setSpreadIdx((i) => i + 1);
      setFlipping(null);
    }, FLIP_MS);
  }

  function prev() {
    if (flipping || phase !== "book") return;
    if (spreadIdx === 0) { setPhase("cover"); return; }
    setFlipping("prev");
    flipTimer.current = window.setTimeout(() => {
      setSpreadIdx((i) => i - 1);
      setFlipping(null);
    }, FLIP_MS);
  }

  function backToToC() { jumpTo(0); }

  const currentRecipe = spreadIdx > 0 ? recipes[spreadIdx - 1] : null;

  function handleBack() {
    if (onClose) onClose();
    else router.push("/");
  }

  return (
    <div className="relative w-full book-paper" style={{ minHeight: "100dvh" }}>
      {/* Top bar */}
      <div className="sticky top-0 bg-stone-50/80 backdrop-blur-sm px-4 sm:px-8 py-3 flex items-center justify-between" style={{ zIndex: 50 }}>
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {onClose ? "ปิดหนังสือ" : "กลับชั้นหนังสือ"}
        </button>
        <div className="text-xs text-stone-400 font-mono tabular-nums">
          {phase === "cover" || phase === "opening" ? "ปก" : `${pg(spreadIdx + 1)} / ${pg(totalSpreads)}`}
        </div>
      </div>

      {phase === "cover" || phase === "opening" ? (
        <CoverPhase
          book={book}
          onOpen={next}
          publicCount={publicCount}
          isOwner={isOwner}
          opening={phase === "opening"}
        />
      ) : (
        <div className="w-full flex items-center justify-center px-2 sm:px-6 pb-10 pt-4"
             style={{ minHeight: "calc(100dvh - 4rem)" }}>
          <div className="relative w-full max-w-6xl book-perspective">
            {/* Book drop shadow */}
            <div className="absolute -bottom-4 left-20 right-20 h-10 rounded-full opacity-25 pointer-events-none"
              style={{ background: "#555", filter: "blur(24px)" }} />

            {/* Spread — static pages */}
            <div
              className="relative flex rounded-sm border border-[#e0cdb4] overflow-hidden book-3d"
              style={{
                boxShadow: "0 18px 56px rgba(0,0,0,.14), inset 0 0 50px rgba(0,0,0,.025)",
                height: "min(82vh, 780px)",
                minHeight: "520px",
              }}
            >
              {/* Left static page — fixed during "next" flip, swapped during "prev" flip */}
              <div className="flex-1 relative">
                {renderLeft(flipping === "prev" ? spreadIdx - 1 : spreadIdx)}
              </div>
              {/* Right static page — fixed during "prev" flip, swapped during "next" flip */}
              <div className="flex-1 relative">
                {renderRight(flipping === "next" ? spreadIdx + 1 : spreadIdx)}
              </div>

              {/* Flipping leaf (right page rotating to left) */}
              {flipping === "next" && (
                <div
                  className="flip-leaf flip-next absolute top-0 bottom-0"
                  style={{ left: "50%", width: "50%", zIndex: 30 }}
                >
                  <div className="flip-face">
                    {renderRight(spreadIdx)}
                    <div className="absolute inset-0 flip-curl-front" />
                  </div>
                  <div className="flip-face flip-face-back">
                    {renderLeft(spreadIdx + 1)}
                    <div className="absolute inset-0 flip-curl-back" />
                  </div>
                </div>
              )}

              {/* Flipping leaf (left page rotating to right) */}
              {flipping === "prev" && (
                <div
                  className="flip-leaf flip-prev absolute top-0 bottom-0"
                  style={{ left: 0, width: "50%", zIndex: 30 }}
                >
                  <div className="flip-face">
                    {renderLeft(spreadIdx)}
                    <div className="absolute inset-0 flip-curl-back" />
                  </div>
                  <div className="flip-face flip-face-back">
                    {renderRight(spreadIdx - 1)}
                    <div className="absolute inset-0 flip-curl-front" />
                  </div>
                </div>
              )}

              {/* Single center spine */}
              <div
                className="absolute top-0 bottom-0 left-1/2 w-px pointer-events-none z-20"
                style={{
                  background: "linear-gradient(to bottom, rgba(180,160,130,.15), rgba(180,160,130,.45), rgba(180,160,130,.15))",
                  transform: "translateX(-0.5px)",
                }}
              />
            </div>

            {/* Edge click-zones (whole half of book, edge-dragging style) */}
            <button
              type="button"
              onClick={prev}
              disabled={!!flipping}
              aria-label="หน้าก่อนหน้า"
              className="absolute top-0 bottom-0 left-0 w-1/2 z-20 cursor-w-resize group disabled:cursor-wait"
              style={{ background: "transparent" }}
            >
              <div className="absolute top-0 left-0 bottom-0 w-[10%] bg-gradient-to-r from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <div className="absolute top-1/2 -translate-y-1/2 left-3 text-stone-400 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1 text-3xl select-none">‹</div>
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!!flipping || spreadIdx >= totalSpreads - 1}
              aria-label="หน้าถัดไป"
              className="absolute top-0 bottom-0 right-0 w-1/2 z-20 cursor-e-resize group disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "transparent" }}
            >
              <div className="absolute top-0 right-0 bottom-0 w-[10%] bg-gradient-to-l from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <div className="absolute top-1/2 -translate-y-1/2 right-3 text-stone-400 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:-translate-x-1 text-3xl select-none">›</div>
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <BookFAB
        context={phase !== "book" ? "cover" : spreadIdx === 0 ? "toc" : "recipe"}
        book={book}
        recipe={currentRecipe}
        isOwner={isOwner}
        onBackToToC={backToToC}
      />

    </div>
  );
}

// ─── Cover phase — click to open (with 3D flip animation) ───
function CoverPhase({ book, onOpen, publicCount, isOwner, opening }: {
  book: Book; onOpen: () => void; publicCount: number; isOwner: boolean; opening: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center px-4 anim-fade-up"
      style={{ minHeight: "calc(100dvh - 8rem)" }}
    >
      <div className="book-perspective">
        <div className={`${opening ? "cover-opening" : ""}`}>
          <div
            onClick={opening ? undefined : onOpen}
            className={`transition-transform duration-300 ${opening ? "" : "cursor-pointer hover:scale-[1.03] active:scale-[0.98]"}`}
            title="คลิกเพื่อเปิดหนังสือ"
          >
            {/* Responsive sizing: lg on small screens, xl on md+ */}
            <div className="hidden md:block">
              <BookCover book={book} size="xl" publicCount={publicCount} />
            </div>
            <div className="md:hidden">
              <BookCover book={book} size="lg" publicCount={publicCount} />
            </div>
          </div>
        </div>
      </div>
      {!opening && (
        <p className="mt-8 text-sm text-stone-400 anim-fade-in">
          {isOwner ? "คลิกที่หนังสือเพื่อเปิดอ่าน" : "คลิกที่หนังสือเพื่อเปิดอ่าน · โหมดดูเท่านั้น"}
        </p>
      )}
    </div>
  );
}
