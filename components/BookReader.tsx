"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Recipe, Book } from "@/lib/types";
import BookCover from "./BookCover";
import BookFAB from "./BookFAB";
import BookFlip, { type BookFlipHandle } from "./BookFlip";

function pg(n: number) {
  return String(n).padStart(2, "0");
}

// ─── Main BookReader ─────────────────────────────────────────────
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
  const [flipType, setFlipType] = useState<"hard" | "soft">("soft");
  const openTimer = useRef<number | null>(null);
  const bookFlipRef = useRef<BookFlipHandle | null>(null);

  useEffect(() => {
    const v = localStorage.getItem("rv_page_flip_type");
    if (v === "hard" || v === "soft") setFlipType(v);
  }, []);

  useEffect(
    () => () => {
      if (openTimer.current) window.clearTimeout(openTimer.current);
    },
    []
  );

  function openBook() {
    setPhase("opening");
    openTimer.current = window.setTimeout(() => {
      setPhase("book");
      setSpreadIdx(0);
    }, 760);
  }

  function backToToC() {
    bookFlipRef.current?.goToSpread(0);
  }

  function handleBack() {
    if (onClose) onClose();
    else router.push("/");
  }

  const totalSpreads = 1 + recipes.length;
  const currentRecipe = spreadIdx > 0 ? recipes[spreadIdx - 1] : null;

  return (
    <div className="relative w-full book-paper" style={{ minHeight: "100dvh" }}>
      {/* Top bar */}
      <div
        className="sticky top-0 bg-stone-50/80 backdrop-blur-sm px-4 sm:px-8 py-3 flex items-center justify-between"
        style={{ zIndex: 50 }}
      >
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {onClose ? "ปิดหนังสือ" : "กลับชั้นหนังสือ"}
        </button>
        <div className="text-xs text-stone-400 font-mono tabular-nums">
          {phase !== "book"
            ? "ปก"
            : `${pg(spreadIdx + 1)} / ${pg(totalSpreads)}`}
        </div>
      </div>

      {phase !== "book" ? (
        <CoverPhase
          book={book}
          onOpen={openBook}
          publicCount={recipes.filter((r) => r.is_public).length}
          isOwner={isOwner}
          opening={phase === "opening"}
        />
      ) : (
        <BookFlip
          ref={bookFlipRef}
          recipes={recipes}
          isOwner={isOwner}
          flipType={flipType}
          onSpreadChange={setSpreadIdx}
        />
      )}

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

// ─── Cover phase ─────────────────────────────────────────────────
const XL_W = 390;
const XL_H = 540;

function CoverPhase({
  book,
  onOpen,
  publicCount,
  isOwner,
  opening,
}: {
  book: Book;
  onOpen: () => void;
  publicCount: number;
  isOwner: boolean;
  opening: boolean;
}) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function recalc() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const availH = vh * 0.84;
      const availW = (vw - 80) * 0.88;
      const s = Math.min(availH / XL_H, availW / XL_W);
      setScale(Math.max(0.5, Math.min(s, 1.8)));
    }
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  const scaledW = Math.round(XL_W * scale);
  const scaledH = Math.round(XL_H * scale);

  return (
    <div
      className="flex items-center justify-center px-4"
      style={{ minHeight: "calc(100dvh - 4rem)" }}
    >
      {/*
        Three-layer structure to avoid CSS transform conflict:
          Layer 1: sets layout footprint to visual size after scale.
          Layer 2: applies transform:scale — no animation.
          Layer 3: cover-opening animation — no scale.
      */}
      <div style={{ width: scaledW, height: scaledH, position: "relative" }}>
        {/* Layer 2 — scale only */}
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: XL_W,
            height: XL_H,
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          {/* Layer 3 — animation only */}
          <div className={opening ? "cover-opening" : ""}>
            <div
              onClick={opening ? undefined : onOpen}
              className={`transition-transform duration-300 ${
                opening ? "" : "cursor-pointer hover:scale-[1.03] active:scale-[0.98]"
              }`}
            >
              <BookCover book={book} size="xl" publicCount={publicCount} />
            </div>
          </div>
        </div>

        {!opening && (
          <p
            className="absolute left-0 right-0 text-center text-sm text-stone-400 anim-fade-in whitespace-nowrap"
            style={{ top: scaledH + 20 }}
          >
            {isOwner
              ? "คลิกที่หนังสือเพื่อเปิดอ่าน"
              : "คลิกที่หนังสือเพื่อเปิดอ่าน · โหมดดูเท่านั้น"}
          </p>
        )}
      </div>
    </div>
  );
}
