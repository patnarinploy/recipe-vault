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
import type { Book, Recipe } from "@/lib/types";

function pg(n: number) {
  return String(n).padStart(2, "0");
}

function darken(hex: string, pct: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - pct);
  const g = Math.max(0, ((n >> 8) & 0xff) - pct);
  const b = Math.max(0, (n & 0xff) - pct);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
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

// ─── Cover face (fills the full page, no fixed px) ──────────────
function BookCoverPageContent({
  book,
  publicCount = 0,
}: {
  book: Book;
  publicCount?: number;
}) {
  const spineColor = `linear-gradient(to right, ${darken(book.cover_color, 20)}, ${book.cover_color})`;
  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* Spine */}
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ width: "8.2%", background: spineColor }}
      >
        <span
          className="text-white/35 tracking-[.4em] truncate"
          style={{ writingMode: "vertical-rl", fontSize: "clamp(6px, 1.8vw, 8px)" }}
        >
          {book.title.slice(0, 18).toUpperCase()}
        </span>
      </div>

      {/* Face */}
      <div
        className="flex-1 relative flex items-center justify-center"
        style={{ background: book.cover_color }}
      >
        {/* Washi tape */}
        <div
          className="absolute pointer-events-none rounded-sm"
          style={{
            top: "4%",
            right: "6%",
            width: "clamp(28px,12%,52px)",
            height: "clamp(10px,3.5%,18px)",
            background:
              "linear-gradient(90deg,rgba(212,184,150,.6),rgba(232,208,172,.7),rgba(212,184,150,.6))",
            transform: "rotate(9deg)",
            boxShadow: "0 1px 3px rgba(0,0,0,.1)",
          }}
        />

        {publicCount > 0 && (
          <div className="absolute bottom-3 right-3 bg-white/95 text-green-600 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
            <Globe className="w-3 h-3" /> แชร์ {publicCount}
          </div>
        )}

        {/* Frame */}
        <div
          className="border border-white/22 text-center text-white flex flex-col items-center justify-center gap-2 mx-3"
          style={{ width: "calc(100% - 1.5rem)", padding: "clamp(1.5rem,8%,3rem) 1rem" }}
        >
          {book.tagline && (
            <>
              <p
                className="tracking-[.38em] text-white/48 uppercase truncate w-full"
                style={{ fontSize: "clamp(8px,1.8vw,11px)" }}
              >
                {book.tagline}
              </p>
              <div className="w-7 h-px bg-white/20" />
            </>
          )}
          <h2
            className="font-bold leading-tight break-words w-full"
            style={{
              fontSize: "clamp(1.25rem,5vw,2.25rem)",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            {book.title}
          </h2>
          {book.subtitle && (
            <>
              <div className="w-7 h-px bg-white/20" />
              <p
                className="text-white/55 line-clamp-2 break-words w-full px-1"
                style={{ fontSize: "clamp(9px,2vw,12px)" }}
              >
                {book.subtitle}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page content ────────────────────────────────────────────────
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
              onClick={(e) => { e.stopPropagation(); onJump(i + 2); }}
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

// Page 0: Front cover (hard, shown alone by showCover)
const PageCoverFront = forwardRef<
  HTMLDivElement,
  { book: Book; publicCount: number }
>(({ book, publicCount }, ref) => (
  <div ref={ref} data-density="hard" style={{ width: "100%", height: "100%" }}>
    <BookCoverPageContent book={book} publicCount={publicCount} />
  </div>
));
PageCoverFront.displayName = "PageCoverFront";

// Page 1: Inside-front (hard, left side of first spread after cover opens)
const PageInsideCover = forwardRef<HTMLDivElement, object>(
  (_props, ref) => (
    <div
      ref={ref}
      data-density="hard"
      className="w-full h-full bg-[#fef9f0]"
    />
  )
);
PageInsideCover.displayName = "PageInsideCover";

// Page 2: ToC (right side of first spread)
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

// Last page: Back cover (hard, shown alone by showCover)
const PageBackCover = forwardRef<
  HTMLDivElement,
  { coverColor: string; onClose?: () => void }
>(({ coverColor, onClose }, ref) => (
  <div
    ref={ref}
    data-density="hard"
    className="w-full h-full flex flex-col items-center justify-center gap-4"
    style={{ background: coverColor }}
  >
    {onClose && (
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="px-6 py-3 rounded-xl text-sm font-medium transition-all hover:scale-105"
        style={{ background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.92)" }}
      >
        ← กลับหน้าชั้นหนังสือ
      </button>
    )}
  </div>
));
PageBackCover.displayName = "PageBackCover";

// ─── Responsive page dimensions ──────────────────────────────────
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
  book: Book;
  recipes: Recipe[];
  isOwner: boolean;
  flipType: "hard" | "soft";
  onSpreadChange: (idx: number) => void;
  onClose?: () => void;
}

// Page numbering with showCover=true:
//   Page 0  : Front cover (hard, alone)
//   Page 1  : Inside-front cover (hard, left of first spread)
//   Page 2  : ToC              (right of first spread)
//   Page 3  : RecipeLeft[0]   (left of second spread)
//   Page 4  : RecipeRight[0]  (right of second spread)
//   ...
//   Page 3+2*(n-1) : RecipeLeft[n-1]
//   Page 4+2*(n-1) : RecipeRight[n-1]
//   Page 3+2n : Back cover (hard, alone)
// Total = 4 + 2n (always even)
//
// spreadIdx mapping:
//   0       → cover (page 0)
//   1       → inside+ToC spread
//   2..n+1  → recipe spreads
//   n+2     → back cover (page 3+2n)

const BookFlip = forwardRef<BookFlipHandle, Props>(
  ({ book, recipes, isOwner, flipType, onSpreadChange, onClose }, ref) => {
    const bookRef = useRef<any>(null);
    const { pageW, pageH, portrait, ready } = usePageDimensions();
    const hasBeenOpenedRef = useRef(false);

    useImperativeHandle(ref, () => ({
      goToSpread(idx: number) {
        // Page for spreadIdx k (k>=1): left page = 2k-1
        if (idx === 0) bookRef.current?.pageFlip().flip(0);
        else bookRef.current?.pageFlip().flip(idx * 2 - 1);
      },
    }));

    useEffect(() => {
      onSpreadChange(0); // start at cover
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFlip = useCallback(
      (e: { data: number }) => {
        const pageIdx = e.data;
        if (pageIdx === 0) {
          // Flipped back to cover
          if (hasBeenOpenedRef.current) onClose?.();
          onSpreadChange(0);
          return;
        }
        hasBeenOpenedRef.current = true;
        // spreadIdx = ceil(pageIdx / 2) for pages 1..last
        onSpreadChange(Math.ceil(pageIdx / 2));
      },
      [onSpreadChange, onClose]
    );

    function jumpToSpread(spreadIdx: number) {
      if (spreadIdx === 0) bookRef.current?.pageFlip().flip(0);
      else bookRef.current?.pageFlip().flip(spreadIdx * 2 - 1);
    }

    const d = flipType;
    const coverColor = book.cover_color;
    const publicCount = recipes.filter((r) => r.is_public).length;

    const pages: React.ReactElement[] = [
      <PageCoverFront key="cover-front" book={book} publicCount={publicCount} />,
      <PageInsideCover key="inside-cover" />,
      <PageToC
        key="toc"
        recipes={recipes}
        onJump={jumpToSpread}
        isOwner={isOwner}
        density={d}
      />,
    ];
    recipes.forEach((r, i) => {
      pages.push(
        <PageRecipeLeft key={`l${i}`} recipe={r} pn={i * 2 + 1} density={d} />
      );
      pages.push(
        <PageRecipeRight key={`r${i}`} recipe={r} pn={i * 2 + 2} density={d} />
      );
    });
    pages.push(
      <PageBackCover key="cover-back" coverColor={coverColor} onClose={onClose} />
    );

    if (!ready) {
      return (
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100dvh - 56px)" }}
        />
      );
    }

    const borderColor = `${coverColor}70`;
    const spineGradient = `linear-gradient(to bottom, transparent, ${coverColor}55, transparent)`;
    const bookW = portrait ? pageW : pageW * 2;

    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "calc(100dvh - 56px)" }}
      >
        {/*
          Wrapper defines visual book size for border + spine.
          NO overflow:hidden so flipping pages extend freely beyond
          the border (matching the StPageFlip demo behaviour).
        */}
        <div
          className="relative"
          style={{
            width: bookW,
            height: pageH,
            border: `2px solid ${borderColor}`,
            borderRadius: "2px 8px 8px 2px",
            boxShadow:
              "0 24px 64px rgba(0,0,0,.18), 0 6px 24px rgba(0,0,0,.10)",
          }}
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
            showCover={true}
            maxShadowOpacity={0.45}
            showPageCorners={false}
            mobileScrollSupport={false}
            clickEventForward={true}
            useMouseEvents={true}
            swipeDistance={30}
            disableFlipByClick={false}
            onFlip={handleFlip}
            className=""
            style={{}}
          >
            {pages}
          </HTMLFlipBook>

          {/* Center spine line — landscape only */}
          {!portrait && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                left: "50%",
                width: 1,
                background: spineGradient,
                transform: "translateX(-0.5px)",
                zIndex: 60,
              }}
            />
          )}
        </div>
      </div>
    );
  }
);

BookFlip.displayName = "BookFlip";
export default BookFlip;
