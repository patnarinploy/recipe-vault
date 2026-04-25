"use client";

import HTMLFlipBook from "react-pageflip";
import { forwardRef, useEffect, useRef, useState } from "react";

// ─── Fake data (mockup only — no real API calls) ─────────────────
const COVER_COLOR = "#b5651d";

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

// ─── Page sizing (mirrors BookFlip logic) ────────────────────────
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
      const portrait = vw < 640;
      // Keep 18% vertical breathing room so flipping page corners stay visible
      const availH = vh * 0.82;
      const availW = portrait ? vw * 0.84 : (vw * 0.9) / 2;
      const scale = Math.max(0.35, Math.min(availH / BASE_H, availW / BASE_W, 1.8));
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

// ─── Page helper components ──────────────────────────────────────
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

// ─── ForwardRef page wrappers (required by react-pageflip) ───────

const PageCoverFront = forwardRef<HTMLDivElement, object>((_p, ref) => (
  <div
    ref={ref}
    data-density="hard"
    className="w-full h-full flex"
    style={{ background: COVER_COLOR }}
  >
    {/* Spine strip */}
    <div
      className="shrink-0 flex items-center justify-center"
      style={{
        width: "8.5%",
        background: `linear-gradient(to right, rgba(0,0,0,.25), rgba(0,0,0,.08))`,
      }}
    >
      <span
        className="text-white/30 tracking-[.4em] truncate"
        style={{ writingMode: "vertical-rl", fontSize: 8 }}
      >
        RECIPE BOOK
      </span>
    </div>

    {/* Face */}
    <div className="flex-1 relative flex items-center justify-center">
      {/* Washi tape */}
      <div
        className="absolute pointer-events-none rounded-sm"
        style={{
          top: "5%",
          right: "7%",
          width: 44,
          height: 14,
          background:
            "linear-gradient(90deg,rgba(212,184,150,.6),rgba(232,208,172,.75),rgba(212,184,150,.6))",
          transform: "rotate(8deg)",
        }}
      />
      {/* Title frame */}
      <div
        className="border border-white/20 flex flex-col items-center justify-center gap-3 text-white text-center mx-4"
        style={{ width: "calc(100% - 2rem)", padding: "2rem 1rem" }}
      >
        <p className="tracking-[.4em] text-white/45 text-[10px] uppercase">
          ตำรับอาหาร
        </p>
        <div className="w-6 h-px bg-white/20" />
        <h2
          className="font-bold text-3xl leading-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          สูตรอร่อย
        </h2>
        <div className="w-6 h-px bg-white/20" />
        <p className="text-white/50 text-xs">คอลเลกชันส่วนตัว</p>
      </div>
    </div>
  </div>
));
PageCoverFront.displayName = "PageCoverFront";

const PageInsideCover = forwardRef<HTMLDivElement, object>((_p, ref) => (
  <div ref={ref} data-density="hard" className="w-full h-full bg-[#fef9f0]" />
));
PageInsideCover.displayName = "PageInsideCover";

const PageToC = forwardRef<HTMLDivElement, object>((_p, ref) => (
  <div
    ref={ref}
    className="w-full h-full bg-[#fef9f0] flex flex-col"
    style={{ padding: "clamp(1.25rem,2.5vw,2.5rem)" }}
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
    <nav className="flex-1 space-y-1.5">
      {FAKE_RECIPES.map((r, i) => (
        <div
          key={i}
          className="flex items-center gap-1 px-2 py-2 rounded-lg text-sm text-stone-500"
        >
          <span className="flex-1 text-stone-700 truncate">{r.title}</span>
          <span className="border-b border-dotted border-stone-300 w-10 shrink-0 mx-2" />
          <span className="shrink-0 text-[11px] font-mono text-stone-400">
            {String(i * 2 + 1).padStart(2, "0")}
          </span>
        </div>
      ))}
    </nav>
  </div>
));
PageToC.displayName = "PageToC";

const PageRecipeLeft = forwardRef<HTMLDivElement, { idx: number }>(
  ({ idx }, ref) => {
    const r = FAKE_RECIPES[idx];
    const pn = idx * 2 + 1;
    return (
      <div
        ref={ref}
        className="w-full h-full bg-[#fef9f0] flex flex-col"
        style={{ padding: "clamp(1.25rem,2.5vw,2.5rem)" }}
      >
        <Tape />
        <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-1.5">
          {r.category}
        </p>
        <h2 className="text-xl font-bold text-stone-800 leading-tight mb-3">
          {r.title}
        </h2>
        <div className="h-px bg-[#e8d5b7] mb-4" />
        <div
          className="rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 mb-4"
          style={{ height: "clamp(100px,22vh,200px)" }}
        >
          <span className="text-stone-300 text-xs italic">[ ภาพประกอบ ]</span>
        </div>
        <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-2">
          วัตถุดิบ:
        </p>
        <div className="flex-1 overflow-hidden text-sm text-stone-600 leading-[1.85] whitespace-pre-line">
          {r.ingredients}
        </div>
        <Pn n={pn} />
      </div>
    );
  }
);
PageRecipeLeft.displayName = "PageRecipeLeft";

const PageRecipeRight = forwardRef<HTMLDivElement, { idx: number }>(
  ({ idx }, ref) => {
    const r = FAKE_RECIPES[idx];
    const pn = idx * 2 + 2;
    return (
      <div
        ref={ref}
        className="w-full h-full bg-[#fef9f0] flex flex-col"
        style={{ padding: "clamp(1.25rem,2.5vw,2.5rem)" }}
      >
        <Tape right />
        <p className="text-[9px] tracking-[.32em] text-[#8a7354] uppercase font-semibold mb-3">
          วิธีทำ:
        </p>
        <div className="flex-1 overflow-hidden text-sm text-stone-600 leading-[1.95] whitespace-pre-line">
          {r.instructions}
        </div>
        <Pn n={pn} right />
      </div>
    );
  }
);
PageRecipeRight.displayName = "PageRecipeRight";

const PageBackCover = forwardRef<HTMLDivElement, object>((_p, ref) => (
  <div
    ref={ref}
    data-density="hard"
    className="w-full h-full flex items-center justify-center"
    style={{ background: COVER_COLOR }}
  >
    <div className="w-6 h-px bg-white/25" />
  </div>
));
PageBackCover.displayName = "PageBackCover";

// ─── Main component ──────────────────────────────────────────────
export default function BookReaderV2() {
  const bookRef = useRef<any>(null);
  const { pageW, pageH, portrait, ready } = usePageDimensions();

  if (!ready) return <div style={{ minHeight: "100vh" }} />;

  const bookW = portrait ? pageW : pageW * 2;
  const borderColor = `${COVER_COLOR}60`;
  const spineGrad = `linear-gradient(to bottom, transparent, ${COVER_COLOR}55, transparent)`;
  // Vertical padding so flipping page corners are never clipped by viewport
  const vPad = Math.round(pageH * 0.14);

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

  return (
    <div
      className="font-apple flex items-center justify-center w-full"
      style={{ minHeight: "100vh", padding: `${vPad}px 16px` }}
    >
      {/*
        NO overflow:hidden — pages must be able to extend outside the
        border box while animating (matching StPageFlip demo behaviour).
      */}
      <div
        className="relative"
        style={{
          width: bookW,
          height: pageH,
          border: `2px solid ${borderColor}`,
          borderRadius: "2px 8px 8px 2px",
          boxShadow:
            "0 32px 80px rgba(0,0,0,.22), 0 8px 28px rgba(0,0,0,.12)",
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
          className=""
          style={{}}
        >
          {pages}
        </HTMLFlipBook>

        {/* Center spine — landscape only */}
        {!portrait && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              left: "50%",
              width: 1,
              background: spineGrad,
              transform: "translateX(-0.5px)",
              zIndex: 60,
            }}
          />
        )}
      </div>
    </div>
  );
}
