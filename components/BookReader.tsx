"use client";

import { useState, useMemo } from "react";
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

// ─── Book Cover (clickable to open) ─────────────────────────────────────────
function CoverPhase({ book, onOpen, publicCount, isOwner }: {
  book: Book; onOpen: () => void; publicCount: number; isOwner: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] anim-fade-up">
      <div
        onClick={onOpen}
        className="cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]"
        title="คลิกเพื่อเปิดหนังสือ"
      >
        <BookCover book={book} size="lg" publicCount={publicCount} />
      </div>
      <p className="mt-6 text-sm text-stone-400">
        {isOwner ? "คลิกที่หนังสือเพื่อเปิดอ่าน" : "คลิกที่หนังสือเพื่อเปิดอ่าน · โหมดดูเท่านั้น"}
      </p>
    </div>
  );
}

// ─── ToC left page ─────────────────────────────────────────────────────────
function ToCPage({ book, recipes, onJump, isOwner }: {
  book: Book; recipes: Recipe[]; onJump: (i: number) => void; isOwner: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col bg-[#fef9f0] p-8 md:p-10 min-h-[600px] relative">
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

// ─── Recipe left page ──────────────────────────────────────────────────────
function RecipeLeft({ recipe, pn }: { recipe: Recipe; pn: number }) {
  const catEn = recipe.category ? (CAT_EN[recipe.category] ?? recipe.category.toUpperCase()) : null;
  const meta = [catEn, recipe.cook_time_minutes ? `${recipe.cook_time_minutes} MINS` : null].filter(Boolean).join(" · ");
  return (
    <div className="flex-1 flex flex-col bg-[#fef9f0] p-8 md:p-10 min-h-[600px] relative">
      <PageTape left />
      {meta && <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-1.5">{meta}</p>}
      <h2 className="text-2xl font-bold text-stone-800 leading-tight mb-3">
        {recipe.title}
        {recipe.is_public && <PageShareBadge />}
      </h2>
      <div className="h-px bg-[#e8d5b7] mb-5" />
      <div className="relative w-full shrink-0 rounded-md overflow-hidden mb-5 bg-amber-50 border border-amber-100"
        style={{ height: 180 }}>
        {recipe.image_url
          ? <Image src={recipe.image_url} alt={recipe.title} fill className="object-cover" />
          : <div className="flex h-full items-center justify-center text-stone-200 text-xs tracking-widest"
              style={{ fontFamily: "Georgia,serif", fontStyle: "italic" }}>
              [ ภาพประกอบ ]
            </div>}
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-2">วัตถุดิบ:</p>
        <div className="text-sm text-stone-600 leading-[1.9] whitespace-pre-line line-clamp-[9] overflow-hidden">
          {recipe.ingredients}
        </div>
      </div>
      <PageNumber n={pn} />
    </div>
  );
}

// ─── Recipe right page ─────────────────────────────────────────────────────
function RecipeRight({ recipe, pn }: { recipe: Recipe; pn: number }) {
  return (
    <div className="flex-1 flex flex-col bg-[#fef9f0] p-8 md:p-10 min-h-[600px] relative">
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
    <div className="flex-1 flex items-center justify-center bg-[#fef9f0] min-h-[600px]">
      <ChefHat className="w-24 h-24 text-amber-100/80" />
    </div>
  );
}

// ─── Main BookReader ───────────────────────────────────────────────────────
interface Props {
  book: Book;
  recipes: Recipe[];
  isOwner: boolean;
}

export default function BookReader({ book, recipes, isOwner }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<"cover" | "book">("cover");
  const [spreadIdx, setSpreadIdx] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [animKey, setAnimKey] = useState(0);

  const totalSpreads = 1 + recipes.length;
  const publicCount = useMemo(() => recipes.filter((r) => r.is_public).length, [recipes]);

  function goTo(idx: number, d: "fwd" | "back") {
    setDir(d);
    setSpreadIdx(Math.max(0, Math.min(idx, totalSpreads - 1)));
    setAnimKey((k) => k + 1);
  }

  function next() {
    if (phase === "cover") { setPhase("book"); setSpreadIdx(0); return; }
    if (spreadIdx < totalSpreads - 1) goTo(spreadIdx + 1, "fwd");
  }

  function prev() {
    if (phase === "book" && spreadIdx === 0) { setPhase("cover"); return; }
    if (phase === "book") goTo(spreadIdx - 1, "back");
  }

  function backToToC() { goTo(0, "back"); }

  const currentRecipe = spreadIdx > 0 ? recipes[spreadIdx - 1] : null;

  function renderSpread() {
    if (spreadIdx === 0) {
      return <>
        <ToCPage book={book} recipes={recipes} onJump={(i) => goTo(i, "fwd")} isOwner={isOwner} />
        <EmptyPage />
      </>;
    }
    const r = recipes[spreadIdx - 1];
    const leftPg = (spreadIdx - 1) * 2 + 1;
    return <>
      <RecipeLeft recipe={r} pn={leftPg} />
      <RecipeRight recipe={r} pn={leftPg + 1} />
    </>;
  }

  return (
    <div className="relative">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1.5 text-stone-400 hover:text-stone-600 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับชั้นหนังสือ
        </button>
        <div className="text-xs text-stone-400 font-mono tabular-nums">
          {phase === "cover" ? "ปก" : `${pg(spreadIdx + 1)} / ${pg(totalSpreads)}`}
        </div>
      </div>

      {phase === "cover" ? (
        <CoverPhase book={book} onOpen={next} publicCount={publicCount} isOwner={isOwner} />
      ) : (
        <div className="w-full max-w-6xl mx-auto">
          <div className="relative">
            {/* Book drop shadow */}
            <div className="absolute -bottom-4 left-20 right-20 h-10 rounded-full opacity-25 pointer-events-none"
              style={{ background: "#555", filter: "blur(24px)" }} />

            {/* Spread */}
            <div
              key={animKey}
              className={`flex overflow-hidden rounded-sm border border-[#e0cdb4] ${
                dir === "fwd" ? "anim-slide-right" : "anim-slide-left"
              }`}
              style={{ boxShadow: "0 18px 56px rgba(0,0,0,.14), inset 0 0 50px rgba(0,0,0,.025)" }}
            >
              {renderSpread()}
            </div>

            {/* Single center spine (single vertical line) */}
            <div
              className="absolute top-0 bottom-0 left-1/2 w-px pointer-events-none"
              style={{
                background: "linear-gradient(to bottom, rgba(180,160,130,.15), rgba(180,160,130,.4), rgba(180,160,130,.15))",
                transform: "translateX(-0.5px)",
              }}
            />

            {/* Edge hover zones — page peel hint + click to turn */}
            <div
              onClick={prev}
              className="absolute top-0 bottom-0 left-0 w-[7%] z-20 cursor-w-resize group"
              title="หน้าก่อนหน้า"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <div className="absolute top-1/2 -translate-y-1/2 left-2 text-stone-400 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1 text-2xl select-none">‹</div>
            </div>
            <div
              onClick={next}
              className="absolute top-0 bottom-0 right-0 w-[7%] z-20 cursor-e-resize group"
              title="หน้าถัดไป"
              style={{ pointerEvents: spreadIdx === totalSpreads - 1 ? "none" : "auto" }}
            >
              <div className="absolute inset-0 bg-gradient-to-l from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <div className="absolute top-1/2 -translate-y-1/2 right-2 text-stone-400 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:-translate-x-1 text-2xl select-none">›</div>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <BookFAB
        context={phase === "cover" ? "cover" : spreadIdx === 0 ? "toc" : "recipe"}
        book={book}
        recipe={currentRecipe}
        isOwner={isOwner}
        onBackToToC={backToToC}
      />
    </div>
  );
}
