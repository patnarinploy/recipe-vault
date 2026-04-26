"use client";

import HTMLFlipBook from "react-pageflip";
import { forwardRef, useEffect, useRef, useState } from "react";

// ─── Fake data ───────────────────────────────────────────────────
const COVER_COLOR = "#b5651d";

function darken(hex: string, amt: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - amt);
  const g = Math.max(0, ((n >> 8) & 0xff) - amt);
  const b = Math.max(0, (n & 0xff) - amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const FAKE_RECIPES = [
  {
    title: "ข้าวผัดกุ้ง",
    category: "THAI FOOD · 15 MINS",
    ingredients:
      "กุ้งขนาดกลาง 200g\nข้าวสวย 2 ถ้วย\nไข่ไก่ 2 ฟอง\nซอสปลา 1 ช้อนโต๊ะ\nน้ำมันพืช 2 ช้อนโต๊ะ\nกระเทียม 3 กลีบ\nต้นหอม ตามชอบ",
    instructions:
      "1. ตั้งกระทะน้ำมัน ใส่กระเทียมสับผัดจนหอม\n2. ใส่กุ้ง ผัดจนสุกชมพู\n3. ใส่ข้าวสวย ผัดให้เข้ากันทั่วกระทะ\n4. ตอกไข่ลงกลาง คนให้เข้ากับข้าว\n5. ปรุงรสด้วยซอสปลา ชิมรส\n6. ใส่ต้นหอม ผัดพอเหี่ยว เสิร์ฟทันที",
  },
  {
    title: "ต้มยำกุ้ง",
    category: "THAI FOOD · 25 MINS",
    ingredients:
      "กุ้งขนาดใหญ่ 300g\nน้ำสต็อก 4 ถ้วย\nเห็ดฟาง 100g\nตะไคร้ 2 ต้น\nใบมะกรูด 5 ใบ\nข่า 3 แว่น\nพริกขี้หนู 5 เม็ด\nน้ำปลา 2 ช้อนโต๊ะ\nน้ำมะนาว 3 ช้อนโต๊ะ",
    instructions:
      "1. ต้มน้ำสต็อกให้เดือด\n2. ใส่ตะไคร้ ข่า และใบมะกรูด\n3. ใส่เห็ดฟาง ต้มสักครู่\n4. ใส่กุ้ง ต้มจนสุก\n5. ปรุงรสด้วยน้ำปลา น้ำมะนาว\n6. ใส่พริก ชิมและปรับรสตามชอบ",
  },
  {
    title: "ผัดกะเพราหมู",
    category: "THAI FOOD · 10 MINS",
    ingredients:
      "หมูสับ 250g\nกะเพราสด 1 กำมือ\nพริกขี้หนูสด 5 เม็ด\nกระเทียม 4 กลีบ\nซอสหอยนางรม 1 ช้อนโต๊ะ\nน้ำปลา 1 ช้อนโต๊ะ\nน้ำตาล 1 ช้อนชา",
    instructions:
      "1. โขลกพริกกับกระเทียมหยาบๆ\n2. ตั้งกระทะน้ำมัน ใส่ส่วนผสมที่โขลก ผัดจนหอม\n3. ใส่หมูสับ ผัดจนสุกทั่ว\n4. ปรุงรสด้วยซอสหอยนางรม น้ำปลา น้ำตาล\n5. ใส่กะเพรา ผัดพอเหี่ยว\n6. เสิร์ฟพร้อมข้าวสวยร้อนๆ",
  },
];

// ─── Page sizing ─────────────────────────────────────────────────
const BASE_W = 390;
const BASE_H = 540;
// Fixed px headroom above & below book so flipping page corner tips
// never hit the viewport edge (the modal centers the book)
const CORNER_PAD = 40;

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
      const portrait = vw < 640;
      const availH = vh - CORNER_PAD * 2;
      const availW = portrait ? vw - 32 : (vw - 32) / 2;
      const scale = Math.max(0.3, Math.min(availH / BASE_H, availW / BASE_W, 1.6));
      setDims({
        pageW: Math.round(BASE_W * scale),
        pageH: Math.round(BASE_H * scale),
        portrait,
        ready: true,
      });
    }
    calc();
    // Debounce resize so HTMLFlipBook only remounts after the user stops dragging
    let t: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(t);
      t = setTimeout(calc, 300);
    }
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, []);

  return dims;
}

// ─── Shared style tokens ─────────────────────────────────────────
// Each page's inner div carries its own border via inset shadow so the edge
// travels with the page during flip.
const PAGE_BORDER = "inset 0 0 0 1px rgba(0,0,0,0.10)";
const COVER_BORDER = "inset 0 0 0 1px rgba(0,0,0,0.08)";
const BOOK_SHADOW = "0 24px 64px rgba(0,0,0,.18), 0 6px 20px rgba(0,0,0,.10)";

// ─── Page helpers ────────────────────────────────────────────────
function Tape({ right }: { right?: boolean }) {
  return (
    <div
      className="absolute top-4 pointer-events-none rounded-sm z-10"
      style={{
        width: 48,
        height: 16,
        [right ? "right" : "left"]: 16,
        background:
          "linear-gradient(90deg,rgba(212,184,150,.6),rgba(232,208,172,.75),rgba(212,184,150,.6))",
        transform: `rotate(${right ? 8 : -8}deg)`,
        boxShadow: "0 1px 3px rgba(0,0,0,.1)",
      }}
    />
  );
}

function Pn({ n, right }: { n: number; right?: boolean }) {
  return (
    <p
      className={`mt-auto pt-3 text-[11px] text-[#c4ad8e] tracking-widest ${right ? "text-right" : ""}`}
      style={{ fontFamily: "Georgia, serif" }}
    >
      {String(n).padStart(2, "0")}
    </p>
  );
}

// ─── ForwardRef page wrappers ────────────────────────────────────
//
// react-pageflip controls the root ref div (transforms, size, z-index).
// All visual styling lives in the INNER div so it travels with the page
// during flip — including the per-page border box-shadow.

const PageCoverFront = forwardRef<HTMLDivElement, object>((_p, ref) => (
  <div ref={ref} data-density="hard">
    <div className="w-full h-full flex overflow-hidden" style={{ boxShadow: COVER_BORDER, borderRadius: 2 }}>
      {/* Spine */}
      <div
        className="shrink-0 flex items-center justify-center"
        style={{
          width: "8.2%",
          background: `linear-gradient(to right, ${darken(COVER_COLOR, 28)}, ${COVER_COLOR})`,
        }}
      >
        <span
          className="text-white/30 tracking-[.4em] truncate"
          style={{ writingMode: "vertical-rl", fontSize: "clamp(6px,1.6vw,8px)" }}
        >
          RECIPE BOOK
        </span>
      </div>
      {/* Face */}
      <div
        className="flex-1 relative flex items-center justify-center"
        style={{ background: COVER_COLOR }}
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
              "linear-gradient(90deg,rgba(212,184,150,.6),rgba(232,208,172,.75),rgba(212,184,150,.6))",
            transform: "rotate(9deg)",
            boxShadow: "0 1px 3px rgba(0,0,0,.1)",
          }}
        />
        {/* Title frame */}
        <div
          className="border border-white/22 text-center text-white flex flex-col items-center justify-center gap-2 mx-3"
          style={{ width: "calc(100% - 1.5rem)", padding: "clamp(1.5rem,8%,3rem) 1rem" }}
        >
          <p
            className="tracking-[.38em] text-white/48 uppercase truncate w-full"
            style={{ fontSize: "clamp(8px,1.8vw,11px)" }}
          >
            ตำรับอาหาร
          </p>
          <div className="w-7 h-px bg-white/20" />
          <h2
            className="font-bold leading-tight break-words w-full"
            style={{ fontSize: "clamp(1.4rem,5vw,2.4rem)", fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            สูตรอร่อย
          </h2>
          <div className="w-7 h-px bg-white/20" />
          <p className="text-white/55" style={{ fontSize: "clamp(9px,2vw,12px)" }}>
            คอลเลกชันส่วนตัว
          </p>
        </div>
      </div>
    </div>
  </div>
));
PageCoverFront.displayName = "PageCoverFront";

const PageInsideCover = forwardRef<HTMLDivElement, object>((_p, ref) => (
  <div ref={ref} data-density="hard">
    <div className="w-full h-full bg-[#fef9f0]" style={{ boxShadow: PAGE_BORDER, borderRadius: 2 }} />
  </div>
));
PageInsideCover.displayName = "PageInsideCover";

const PageToC = forwardRef<HTMLDivElement, object>((_p, ref) => (
  <div ref={ref}>
    <div
      className="w-full h-full bg-[#fef9f0] flex flex-col relative"
      style={{ padding: "clamp(1.25rem,2.5vw,2.5rem)", boxShadow: PAGE_BORDER, borderRadius: 2 }}
    >
      <Tape />
      <p className="text-[9px] tracking-[.38em] text-[#8a7354] uppercase font-semibold mb-2 mt-1">
        Table of Contents
      </p>
      <h2
        className="text-2xl font-bold text-stone-700 mb-5 leading-tight"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        สารบัญ
      </h2>
      <nav className="flex-1 space-y-1.5 overflow-hidden">
        {FAKE_RECIPES.map((r, i) => (
          <div key={i} className="flex items-center gap-1 px-2 py-2 text-sm">
            <span className="flex-1 text-stone-700 truncate">{r.title}</span>
            <span className="border-b border-dotted border-stone-300 w-10 shrink-0 mx-2" />
            <span className="shrink-0 text-[11px] font-mono text-stone-400">
              {String(i * 2 + 1).padStart(2, "0")}
            </span>
          </div>
        ))}
      </nav>
    </div>
  </div>
));
PageToC.displayName = "PageToC";

const PageRecipeLeft = forwardRef<HTMLDivElement, { idx: number }>(({ idx }, ref) => {
  const r = FAKE_RECIPES[idx];
  return (
    <div ref={ref}>
      <div
        className="w-full h-full bg-[#fef9f0] flex flex-col relative"
        style={{ padding: "clamp(1.25rem,2.5vw,2.5rem)", boxShadow: PAGE_BORDER, borderRadius: 2 }}
      >
        <Tape />
        <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-1.5">
          {r.category}
        </p>
        <h2 className="text-xl font-bold text-stone-800 leading-tight mb-3">{r.title}</h2>
        <div className="h-px bg-[#e8d5b7] mb-4" />
        <div
          className="rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 mb-4"
          style={{ height: "clamp(90px,20vh,190px)" }}
        >
          <span className="text-stone-300 text-xs italic">[ ภาพประกอบ ]</span>
        </div>
        <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-2">
          วัตถุดิบ:
        </p>
        <div className="flex-1 overflow-hidden text-sm text-stone-600 leading-[1.85] whitespace-pre-line">
          {r.ingredients}
        </div>
        <Pn n={idx * 2 + 1} />
      </div>
    </div>
  );
});
PageRecipeLeft.displayName = "PageRecipeLeft";

const PageRecipeRight = forwardRef<HTMLDivElement, { idx: number }>(({ idx }, ref) => {
  const r = FAKE_RECIPES[idx];
  return (
    <div ref={ref}>
      <div
        className="w-full h-full bg-[#fef9f0] flex flex-col relative"
        style={{ padding: "clamp(1.25rem,2.5vw,2.5rem)", boxShadow: PAGE_BORDER, borderRadius: 2 }}
      >
        <Tape right />
        <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-3">
          วิธีทำ:
        </p>
        <div className="flex-1 overflow-hidden text-sm text-stone-600 leading-[1.95] whitespace-pre-line">
          {r.instructions}
        </div>
        <Pn n={idx * 2 + 2} right />
      </div>
    </div>
  );
});
PageRecipeRight.displayName = "PageRecipeRight";

const PageBackCover = forwardRef<HTMLDivElement, object>((_p, ref) => (
  <div ref={ref} data-density="hard">
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: COVER_COLOR, boxShadow: COVER_BORDER, borderRadius: 2 }}
    >
      <div className="w-8 h-px bg-white/20" />
    </div>
  </div>
));
PageBackCover.displayName = "PageBackCover";

// ─── Main component ──────────────────────────────────────────────
// Returns the book element only — the modal handles centering.
export default function BookReaderV2() {
  const bookRef = useRef<any>(null);
  const { pageW, pageH, portrait, ready } = usePageDimensions();

  // 'cover'     → only right half visible (front cover alone on right)
  // 'backCover' → only left half visible (back cover alone on left)
  // 'spread'    → full two-page spread
  const [shadowMode, setShadowMode] = useState<"cover" | "spread" | "backCover">("cover");

  // When HTMLFlipBook remounts after a resize it resets to page 0 — sync shadow.
  const flipKey = `${pageW}x${pageH}`;
  useEffect(() => {
    setShadowMode("cover");
  }, [flipKey]);

  if (!ready) return null;

  const bookW = portrait ? pageW : pageW * 2;

  const pages: React.ReactElement[] = [
    <PageCoverFront key="cf" />,
    <PageInsideCover key="ic" />,
    <PageToC key="toc" />,
  ];
  FAKE_RECIPES.forEach((_, i) => {
    pages.push(<PageRecipeLeft key={`l${i}`} idx={i} />);
    pages.push(<PageRecipeRight key={`r${i}`} idx={i} />);
  });
  pages.push(<PageBackCover key="cb" />);

  const totalPages = pages.length;

  // Shadow timing is direction-dependent:
  //
  //  spread → cover / backCover  (closing):
  //    Switch shadow at flip START (onFlip) so the half-shadow lifts away
  //    together with the page — matches the user's expectation exactly.
  //
  //  cover / backCover → spread  (opening):
  //    Switch shadow at flip END (onChangeState "read") because the empty
  //    half stays empty for the whole animation; switching early would flash
  //    a shadow on a side that has no page yet.

  function handleFlip(e: any) {
    const page = e.data as number;
    if (!portrait && page === 0) setShadowMode("cover");
    else if (!portrait && page === totalPages - 1) setShadowMode("backCover");
    // Spread arrival: handled by onChangeState to avoid early-flash on empty side
  }

  function handleChangeState(e: any) {
    if (e.data !== "read") return;
    const page = bookRef.current?.pageFlip?.()?.getCurrentPageIndex?.() ?? 0;
    // Only update shadow when the settled page is a spread.
    // cover / backCover are already set by onFlip (or by useEffect on resize).
    if (page !== 0 && page !== totalPages - 1) setShadowMode("spread");
  }

  const coverOnly = !portrait && shadowMode === "cover";
  const backCoverOnly = !portrait && shadowMode === "backCover";

  return (
    /*
      No background: pages fill their own halves, empty half stays transparent.
      No overflow:hidden: pages extend past the container during flip corners.
      Shadow is on an absolutely-positioned inner div so it covers only the
      side(s) that have a visible page — no ghost shadow on the empty half.
    */
    <div
      className="font-apple relative"
      style={{ width: bookW, height: pageH }}
    >
      {/* Shadow layer — tracks which side(s) have a visible page */}
      {coverOnly ? (
        // Front cover alone on right
        <div
          className="absolute inset-y-0 right-0 pointer-events-none"
          style={{ width: pageW, zIndex: 0, boxShadow: BOOK_SHADOW }}
        />
      ) : backCoverOnly ? (
        // Back cover alone on left
        <div
          className="absolute inset-y-0 left-0 pointer-events-none"
          style={{ width: pageW, zIndex: 0, boxShadow: BOOK_SHADOW }}
        />
      ) : (
        // Two-page spread (or portrait) — full width
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 0, boxShadow: BOOK_SHADOW }}
        />
      )}

      {/*
        key={flipKey} forces HTMLFlipBook to fully remount when dimensions
        change after a resize. react-pageflip ignores width/height prop
        updates after the initial mount (size="fixed" mode).
      */}
      <HTMLFlipBook
        key={flipKey}
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
        mobileScrollSupport={true}
        clickEventForward={false}
        useMouseEvents={true}
        swipeDistance={10}
        disableFlipByClick={false}
        className=""
        style={{}}
        onFlip={handleFlip}
        onChangeState={handleChangeState}
      >
        {pages}
      </HTMLFlipBook>
    </div>
  );
}
