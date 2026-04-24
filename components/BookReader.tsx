"use client";

import { useState } from "react";
import Image from "next/image";
import { ChefHat, Users, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { type Recipe } from "@/lib/types";
import AddRecipeButton from "./AddRecipeButton";

// ─── helpers ────────────────────────────────────────────────────────────────
function pg(n: number) { return String(n).padStart(2, "0"); }

const CAT_EN: Record<string, string> = {
  "อาหารไทย": "THAI FOOD", "อาหารจีน": "CHINESE", "อาหารญี่ปุ่น": "JAPANESE",
  "อาหารตะวันตก": "WESTERN", "อาหารอิตาลี": "ITALIAN", "อาหารอินเดีย": "INDIAN",
  "ของหวาน": "DESSERT", "เครื่องดื่ม": "DRINKS", "อื่นๆ": "OTHERS",
};

// ─── Tape decoration ────────────────────────────────────────────────────────
function Tape({ top = true, right = true }: { top?: boolean; right?: boolean }) {
  return (
    <div className="absolute pointer-events-none z-10" style={{
      top: top ? 10 : "auto", bottom: top ? "auto" : 10,
      right: right ? 20 : "auto", left: right ? "auto" : 20,
      width: 52, height: 18,
      background: "linear-gradient(90deg,rgba(212,184,150,.6),rgba(232,208,172,.7),rgba(212,184,150,.6))",
      borderRadius: 3, transform: `rotate(${right ? 9 : -9}deg)`,
      boxShadow: "0 1px 3px rgba(0,0,0,.1)",
    }} />
  );
}

function PageNumber({ n, right }: { n: number; right?: boolean }) {
  return (
    <p className={`mt-auto pt-4 text-[11px] text-[#b8a48a] font-serif-book tracking-widest ${right ? "text-right" : "text-left"}`}>
      {pg(n)}
    </p>
  );
}

// ─── Book Cover (closed state) ───────────────────────────────────────────────
function BookCover({ onOpen, count, username }: { onOpen: () => void; count: number; username: string }) {
  return (
    <div className="flex flex-col items-center py-8 anim-fade-up">
      <div className="relative mb-6">
        {/* Drop shadow */}
        <div className="absolute -bottom-3 left-4 right-4 h-8 rounded-full opacity-30"
          style={{ background: "#444", filter: "blur(18px)" }} />
        {/* Book body */}
        <div className="relative flex overflow-hidden"
          style={{ width: 240, height: 320, borderRadius: "2px 6px 6px 2px",
            boxShadow: "5px 10px 36px rgba(0,0,0,.28), -2px 0 10px rgba(0,0,0,.14)" }}>
          {/* Spine */}
          <div className="shrink-0 flex items-center justify-center bg-gradient-to-r from-[#3e5339] to-[#556e4c]"
            style={{ width: 22 }}>
            <span className="text-white/35 text-[7px] tracking-[.45em]"
              style={{ writingMode: "vertical-rl" }}>RECIPE VAULT</span>
          </div>
          {/* Face */}
          <div className="flex-1 bg-[#6b7c5b] flex items-center justify-center relative p-5">
            <Tape top right />
            <div className="border border-white/22 w-full py-8 px-3 text-center text-white flex flex-col items-center gap-2.5">
              <p className="text-[8.5px] tracking-[.38em] text-white/48 uppercase">Have a Nice Meal</p>
              <div className="w-7 h-px bg-white/20" />
              <h1 className="text-2xl font-bold leading-tight font-serif-book">The Cozy<br />Folio</h1>
              <div className="w-7 h-px bg-white/20" />
              <p className="text-[9.5px] text-white/48">บันทึกสูตรอาหารอุ่นหัวใจ</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-stone-400 mb-5">
        {count > 0 ? `${count} สูตร · สมุดของ ${username}` : `ยังไม่มีสูตร · เริ่มเพิ่มเลย`}
      </p>
      <div className="flex gap-3">
        <AddRecipeButton variant="navbar" label="+ เพิ่มสูตร" />
        {count > 0 && (
          <button onClick={onOpen}
            className="flex items-center gap-1.5 bg-[#6b7c5b] hover:bg-[#5a6948] text-white px-5 py-2 rounded-xl text-sm font-medium shadow-sm transition-all">
            <BookOpen className="w-4 h-4" /> เปิดหน้าถัดไป →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ToC left page ───────────────────────────────────────────────────────────
function ToCPage({ recipes, onJump }: { recipes: Recipe[]; onJump: (i: number) => void }) {
  return (
    <div className="flex-1 flex flex-col bg-[#fef9f0] border-r border-[#e8d5b7]/60 p-7 min-h-[500px] relative overflow-hidden">
      <Tape top={false} right={false} />
      <p className="text-[8.5px] tracking-[.38em] text-[#8a7354] uppercase font-semibold mb-2">Table of Contents</p>
      <h2 className="text-2xl font-bold text-stone-700 mb-6 leading-tight font-serif-book">
        สารบัญ<br />ความอร่อย
      </h2>
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {recipes.map((r, i) => (
          <button key={r.id} onClick={() => onJump(i + 1)}
            className="w-full flex items-center gap-1 px-1.5 py-2 rounded-lg hover:bg-amber-50/80 transition-colors group text-left">
            <span className="flex-1 text-sm text-stone-600 group-hover:text-stone-800 truncate">{r.title}</span>
            <span className="border-b border-dotted border-stone-200 w-8 shrink-0 mx-2" />
            <span className="shrink-0 text-[11px] text-stone-400 group-hover:text-[#8a7354] font-mono">หน้า {pg(i * 2 + 1)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── Recipe left page ─────────────────────────────────────────────────────────
function RecipeLeft({ recipe, pn }: { recipe: Recipe; pn: number }) {
  const catEn = recipe.category ? (CAT_EN[recipe.category] ?? recipe.category.toUpperCase()) : null;
  const meta = [catEn, recipe.cook_time_minutes ? `${recipe.cook_time_minutes} MINS` : null].filter(Boolean).join(" · ");
  return (
    <div className="flex-1 flex flex-col bg-[#fef9f0] border-r border-[#e8d5b7]/60 p-7 min-h-[500px] relative">
      <Tape top right={false} />
      {meta && <p className="text-[8.5px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-1.5">{meta}</p>}
      <h2 className="text-[1.65rem] font-bold text-stone-800 leading-tight mb-3 font-serif-book">{recipe.title}</h2>
      <div className="h-px bg-[#e8d5b7] mb-4" />
      {/* Image */}
      <div className="relative w-full shrink-0 rounded-md overflow-hidden mb-4 bg-amber-50 border border-amber-100"
        style={{ height: 150 }}>
        {recipe.image_url
          ? <Image src={recipe.image_url} alt={recipe.title} fill className="object-cover" />
          : <div className="flex h-full items-center justify-center text-stone-200 text-xs tracking-widest"
              style={{ fontFamily: "Georgia,serif", fontStyle: "italic" }}>
              [ ภาพประกอบ ]
            </div>
        }
      </div>
      {/* Ingredients */}
      <div className="flex-1 overflow-hidden">
        <p className="text-[8.5px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-2">วัตถุดิบ:</p>
        <div className="text-sm text-stone-600 leading-[1.8] whitespace-pre-line line-clamp-[8] overflow-hidden">
          {recipe.ingredients}
        </div>
      </div>
      <PageNumber n={pn} />
    </div>
  );
}

// ─── Recipe right page ────────────────────────────────────────────────────────
function RecipeRight({ recipe, pn }: { recipe: Recipe; pn: number }) {
  return (
    <div className="flex-1 flex flex-col bg-[#fef9f0] p-7 min-h-[500px] relative">
      {recipe.description && (
        <p className="text-sm text-stone-500 italic mb-4 leading-relaxed font-serif-book">{recipe.description}</p>
      )}
      <p className="text-[8.5px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-2">วิธีทำ:</p>
      <div className="flex-1 overflow-hidden text-sm text-stone-600 leading-[1.9] whitespace-pre-line">
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

// ─── Empty right page ─────────────────────────────────────────────────────────
function EmptyPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#fef9f0] min-h-[500px]">
      <ChefHat className="w-20 h-20 text-amber-100/80" />
    </div>
  );
}

// ─── Main BookReader ──────────────────────────────────────────────────────────
interface Props { myRecipes: Recipe[]; publicRecipes: Recipe[]; username: string; }

export default function BookReader({ myRecipes, publicRecipes, username }: Props) {
  const [tab, setTab] = useState<"mine" | "public">("mine");
  const recipes = tab === "mine" ? myRecipes : publicRecipes;

  const [phase, setPhase] = useState<"cover" | "book">("cover");
  const [spreadIdx, setSpreadIdx] = useState(0);   // 0 = ToC, 1..n = recipe n-1
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [animKey, setAnimKey] = useState(0);

  const totalSpreads = 1 + recipes.length;

  function goTo(idx: number, d: "fwd" | "back") {
    setDir(d);
    setSpreadIdx(Math.max(0, Math.min(idx, totalSpreads - 1)));
    setAnimKey((k) => k + 1);
  }

  function next() {
    if (phase === "cover") { if (recipes.length) { setPhase("book"); } return; }
    if (spreadIdx < totalSpreads - 1) goTo(spreadIdx + 1, "fwd");
  }

  function prev() {
    if (phase === "book" && spreadIdx === 0) { setPhase("cover"); return; }
    if (phase === "book") goTo(spreadIdx - 1, "back");
  }

  function switchTab(t: "mine" | "public") {
    setTab(t); setPhase("cover"); setSpreadIdx(0);
  }

  function renderSpread() {
    if (spreadIdx === 0) return (
      <>
        <ToCPage recipes={recipes} onJump={(i) => goTo(i, "fwd")} />
        <EmptyPage />
      </>
    );
    const r = recipes[spreadIdx - 1];
    const leftPg = (spreadIdx - 1) * 2 + 1;
    return <><RecipeLeft recipe={r} pn={leftPg} /><RecipeRight recipe={r} pn={leftPg + 1} /></>;
  }

  const atEnd = phase === "book" && spreadIdx === totalSpreads - 1;

  return (
    <div className="flex flex-col items-center">
      {/* Tab */}
      <div className="flex gap-2 mb-6 self-start">
        {(["mine", "public"] as const).map((t) => (
          <button key={t} onClick={() => switchTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              tab === t ? "bg-[#6b7c5b] text-white shadow-sm" : "text-stone-500 hover:bg-stone-100"}`}>
            {t === "mine" ? "📚 ของฉัน" : "🌐 สาธารณะ"}
          </button>
        ))}
        <div className="ml-auto pl-4">
          <AddRecipeButton variant="navbar" label="+ เพิ่มสูตร" />
        </div>
      </div>

      {phase === "cover"
        ? <BookCover onOpen={next} count={recipes.length} username={username} />
        : (
          <div className="w-full max-w-5xl">
            {/* Book frame */}
            <div className="relative">
              {/* Shadow */}
              <div className="absolute -bottom-3 left-16 right-16 h-8 rounded-full opacity-25"
                style={{ background: "#555", filter: "blur(22px)" }} />

              {/* Side nav arrows */}
              <button onClick={prev}
                className="absolute -left-5 top-1/2 -translate-y-1/2 z-30 w-9 h-14 bg-white/90 hover:bg-white rounded-r-xl shadow-md flex items-center justify-center text-stone-400 hover:text-stone-600 transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={next} disabled={atEnd}
                className="absolute -right-5 top-1/2 -translate-y-1/2 z-30 w-9 h-14 bg-white/90 hover:bg-white rounded-l-xl shadow-md flex items-center justify-center text-stone-400 hover:text-stone-600 transition-all disabled:opacity-30">
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Animated spread */}
              <div key={animKey}
                className={`flex overflow-hidden rounded-sm border border-[#e0cdb4] ${dir === "fwd" ? "anim-slide-right" : "anim-slide-left"}`}
                style={{ boxShadow: "0 16px 50px rgba(0,0,0,.13), inset 0 0 40px rgba(0,0,0,.02)" }}>
                {renderSpread()}
              </div>

              {/* Spine */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px pointer-events-none z-10"
                style={{ background: "linear-gradient(to bottom, #ddd, #bbb, #ddd)" }} />
            </div>

            {/* Bottom nav */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button onClick={prev}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 shadow-sm transition-all">
                ← ย้อนกลับ
              </button>
              <span className="text-xs text-stone-400 font-mono tabular-nums px-2">
                {pg(spreadIdx + 1)} / {pg(totalSpreads)}
              </span>
              <button onClick={next} disabled={atEnd}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#6b7c5b] hover:bg-[#5a6948] text-white text-sm font-medium shadow-sm transition-all disabled:opacity-35">
                เปิดหน้าถัดไป →
              </button>
            </div>
          </div>
        )
      }
    </div>
  );
}
