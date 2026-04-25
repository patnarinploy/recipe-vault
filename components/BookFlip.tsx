"use client";

import HTMLFlipBook from "react-pageflip";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { ChefHat, Globe, Users } from "lucide-react";
import type { Recipe } from "@/lib/types";

function pg(n: number) {
  return String(n).padStart(2, "0");
}

const CAT_EN: Record<string, string> = {
  อาหารไทย: "THAI FOOD",
  อาหารจีน: "CHINESE",
  อาหารญี่ปุ่น: "JAPANESE",
  อาหารตะวันตก: "WESTERN",
  อาหารอิตาลี: "ITALIAN",
  อาหารอินเดีย: "INDIAN",
  ของหวาน: "DESSERT",
  เครื่องดื่ม: "DRINKS",
  อื่นๆ: "OTHERS",
};

// ─── Decorative helpers ─────────────────────────────────────────
function PageTape({ left }: { left?: boolean }) {
  return (
    <div
      className="absolute top-4 z-10 pointer-events-none rounded-sm"
      style={{
        width: 52,
        height: 18,
        [left ? "left" : "right"]: 20,
        background:
          "linear-gradient(90deg,rgba(212,184,150,.6),rgba(232,208,172,.7),rgba(212,184,150,.6))",
        transform: `rotate(${left ? -9 : 9}deg)`,
        boxShadow: "0 1px 3px rgba(0,0,0,.1)",
      }}
    />
  );
}

function PageNum({ n, right }: { n: number; right?: boolean }) {
  return (
    <p
      className={`mt-auto pt-4 text-[11px] text-[#b8a48a] tracking-widest ${right ? "text-right" : "text-left"}`}
      style={{ fontFamily: "Georgia, serif" }}
    >
      {pg(n)}
    </p>
  );
}

function ShareBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold ml-2 align-middle">
      <Globe className="w-2.5 h-2.5" /> แชร์แล้ว
    </span>
  );
}

// ─── Page content (inner display components) ────────────────────
function ToCContent({
  recipes,
  onJump,
  isOwner,
}: {
  recipes: Recipe[];
  onJump: (spreadIdx: number) => void;
  isOwner: boolean;
}) {
  return (
    <div
      className="w-full h-full flex flex-col bg-[#fef9f0] relative"
      style={{ padding: "clamp(1.25rem, 2.5vw, 2.5rem)" }}
    >
      <PageTape left />
      <p className="text-[9px] tracking-[.38em] text-[#8a7354] uppercase font-semibold mb-2">
        Table of Contents
      </p>
      <h2 className="text-2xl font-bold text-stone-700 mb-4 leading-tight">
        สารบัญความอร่อย
      </h2>
      {recipes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-stone-300">
          <ChefHat className="w-14 h-14 mb-3" />
          <p className="text-sm">
            {isOwner ? "ยังไม่มีสูตรในเล่มนี้" : "หนังสือเล่มนี้ยังไม่มีสูตรสาธารณะ"}
          </p>
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
                {r.is_public && <ShareBadge />}
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

function RecipeLeftContent({ recipe, pn }: { recipe: Recipe; pn: number }) {
  const catEn = recipe.category
    ? (CAT_EN[recipe.category] ?? recipe.category.toUpperCase())
    : null;
  const meta = [
    catEn,
    recipe.cook_time_minutes ? `${recipe.cook_time_minutes} MINS` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="w-full h-full flex flex-col bg-[#fef9f0] relative"
      style={{ padding: "clamp(1.25rem, 2.5vw, 2.5rem)" }}
    >
      <PageTape left />
      {meta && (
        <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-1.5">
          {meta}
        </p>
      )}
      <h2 className="text-2xl font-bold text-stone-800 leading-tight mb-3">
        {recipe.title}
        {recipe.is_public && <ShareBadge />}
      </h2>
      <div className="h-px bg-[#e8d5b7] mb-5" />
      <div
        className="relative w-full shrink-0 rounded-md overflow-hidden mb-5 bg-amber-50 border border-amber-100"
        style={{ height: "clamp(120px, 24vh, 240px)" }}
      >
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-stone-200 text-xs tracking-widest"
            style={{ fontFamily: "Georgia,serif", fontStyle: "italic" }}
          >
            [ ภาพประกอบ ]
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-2">
          วัตถุดิบ:
        </p>
        <div className="text-sm text-stone-600 leading-[1.9] whitespace-pre-line overflow-hidden">
          {recipe.ingredients}
        </div>
      </div>
      <PageNum n={pn} />
    </div>
  );
}

function RecipeRightContent({ recipe, pn }: { recipe: Recipe; pn: number }) {
  return (
    <div
      className="w-full h-full flex flex-col bg-[#fef9f0] relative"
      style={{ padding: "clamp(1.25rem, 2.5vw, 2.5rem)" }}
    >
      <PageTape />
      {recipe.description && (
        <p
          className="text-sm text-stone-500 italic mb-4 leading-relaxed"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {recipe.description}
        </p>
      )}
      <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-2">
        วิธีทำ:
      </p>
      <div className="flex-1 overflow-hidden text-sm text-stone-600 leading-[1.95] whitespace-pre-line">
        {recipe.instructions}
      </div>
      {recipe.servings && (
        <div className="mt-3 pt-3 border-t border-[#e8d5b7] text-xs text-stone-400 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {recipe.servings} ที่
        </div>
      )}
      <PageNum n={pn} right />
    </div>
  );
}

// ─── ForwardRef page wrappers (required by react-pageflip) ──────
const PageToC = forwardRef<
  HTMLDivElement,
  {
    recipes: Recipe[];
    onJump: (i: number) => void;
    isOwner: boolean;
    density: "hard" | "soft";
  }
>(({ recipes, onJump, isOwner, density }, ref) => (
  <div ref={ref} data-density={density}>
    <ToCContent recipes={recipes} onJump={onJump} isOwner={isOwner} />
  </div>
));
PageToC.displayName = "PageToC";

const PageBlank = forwardRef<HTMLDivElement, { density: "hard" | "soft" }>(
  ({ density }, ref) => (
    <div
      ref={ref}
      data-density={density}
      className="w-full h-full bg-[#fef9f0] flex items-center justify-center"
    >
      <ChefHat className="w-20 h-20 text-amber-100/60" />
    </div>
  )
);
PageBlank.displayName = "PageBlank";

const PageRecipeLeft = forwardRef<
  HTMLDivElement,
  { recipe: Recipe; pn: number; density: "hard" | "soft" }
>(({ recipe, pn, density }, ref) => (
  <div ref={ref} data-density={density}>
    <RecipeLeftContent recipe={recipe} pn={pn} />
  </div>
));
PageRecipeLeft.displayName = "PageRecipeLeft";

const PageRecipeRight = forwardRef<
  HTMLDivElement,
  { recipe: Recipe; pn: number; density: "hard" | "soft" }
>(({ recipe, pn, density }, ref) => (
  <div ref={ref} data-density={density}>
    <RecipeRightContent recipe={recipe} pn={pn} />
  </div>
));
PageRecipeRight.displayName = "PageRecipeRight";

// ─── Responsive page size ────────────────────────────────────────
const BASE_W = 390;
const BASE_H = 540;

function usePageDimensions() {
  const [dims, setDims] = useState({
    pageW: BASE_W,
    pageH: BASE_H,
    portrait: false,
    ready: false,
  });

  useEffect(() => {
    function calc() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const topBar = 56;
      const availH = (vh - topBar) * 0.95;
      const portrait = vw < 640;
      const availW = portrait ? vw - 32 : vw - 48;
      const sH = availH / BASE_H;
      const sW = portrait ? availW / BASE_W : availW / (BASE_W * 2);
      const scale = Math.max(0.4, Math.min(sH, sW, 2.0));
      setDims({
        pageW: Math.round(BASE_W * scale),
        pageH: Math.round(BASE_H * scale),
        portrait,
        ready: true,
      });
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  return dims;
}

// ─── Public interface ────────────────────────────────────────────
export interface BookFlipHandle {
  goToSpread(idx: number): void;
}

interface Props {
  recipes: Recipe[];
  isOwner: boolean;
  flipType: "hard" | "soft";
  onSpreadChange: (idx: number) => void;
}

const BookFlip = forwardRef<BookFlipHandle, Props>(
  ({ recipes, isOwner, flipType, onSpreadChange }, ref) => {
    const bookRef = useRef<any>(null);
    const { pageW, pageH, portrait, ready } = usePageDimensions();

    useImperativeHandle(ref, () => ({
      goToSpread(idx: number) {
        bookRef.current?.pageFlip().flip(idx * 2);
      },
    }));

    // Notify parent of initial spread on mount
    useEffect(() => {
      onSpreadChange(0);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFlip = useCallback(
      (e: { data: number }) => {
        onSpreadChange(Math.floor(e.data / 2));
      },
      [onSpreadChange]
    );

    function jumpToSpread(spreadIdx: number) {
      bookRef.current?.pageFlip().flip(spreadIdx * 2);
    }

    const d = flipType;

    // Build flat page array
    const pages: React.ReactElement[] = [
      <PageToC
        key="toc"
        recipes={recipes}
        onJump={jumpToSpread}
        isOwner={isOwner}
        density={d}
      />,
      <PageBlank key="blank" density={d} />,
    ];
    recipes.forEach((r, i) => {
      pages.push(
        <PageRecipeLeft key={`l${i}`} recipe={r} pn={i * 2 + 1} density={d} />
      );
      pages.push(
        <PageRecipeRight key={`r${i}`} recipe={r} pn={i * 2 + 2} density={d} />
      );
    });

    if (!ready) {
      return (
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100dvh - 56px)" }}
        />
      );
    }

    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "calc(100dvh - 56px)" }}
      >
        <HTMLFlipBook
          ref={bookRef}
          width={pageW}
          height={pageH}
          minWidth={100}
          maxWidth={800}
          minHeight={100}
          maxHeight={1100}
          size="fixed"
          startPage={0}
          startZIndex={20}
          autoSize={false}
          flippingTime={800}
          usePortrait={portrait}
          drawShadow={true}
          showCover={false}
          maxShadowOpacity={0.45}
          showPageCorners={false}
          mobileScrollSupport={false}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          disableFlipByClick={false}
          onFlip={handleFlip}
          className=""
          style={{
            boxShadow:
              "0 20px 60px rgba(0,0,0,.16), 0 4px 20px rgba(0,0,0,.08)",
          }}
        >
          {pages}
        </HTMLFlipBook>
      </div>
    );
  }
);

BookFlip.displayName = "BookFlip";
export default BookFlip;
