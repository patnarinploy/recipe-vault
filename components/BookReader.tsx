"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Recipe, Book } from "@/lib/types";
import BookFAB from "./BookFAB";
import BookFlip, { type BookFlipHandle } from "./BookFlip";

function pg(n: number) {
  return String(n).padStart(2, "0");
}

interface Props {
  book: Book;
  recipes: Recipe[];
  isOwner: boolean;
  onClose?: () => void;
}

export default function BookReader({ book, recipes, isOwner, onClose }: Props) {
  const router = useRouter();
  const [spreadIdx, setSpreadIdx] = useState(0);
  const [flipType, setFlipType] = useState<"hard" | "soft">("soft");
  const bookFlipRef = useRef<BookFlipHandle | null>(null);

  useEffect(() => {
    const v = localStorage.getItem("rv_page_flip_type");
    if (v === "hard" || v === "soft") setFlipType(v);
  }, []);

  function backToToC() {
    bookFlipRef.current?.goToSpread(1);
  }

  function handleBack() {
    if (onClose) onClose();
    else router.push("/");
  }

  // spreadIdx: 0=cover, 1=toc, 2..n+1=recipes, n+2=back cover
  const totalSpreads = recipes.length + 3;
  const currentRecipe =
    spreadIdx >= 2 && spreadIdx <= recipes.length + 1
      ? recipes[spreadIdx - 2]
      : null;

  const fabContext =
    spreadIdx === 0 || spreadIdx >= recipes.length + 2
      ? "cover"
      : spreadIdx === 1
      ? "toc"
      : "recipe";

  return (
    <div className="relative w-full bg-stone-50" style={{ minHeight: "100dvh" }}>
      {/* Top bar */}
      <div
        className="sticky top-0 bg-stone-50/90 backdrop-blur-sm border-b border-stone-100 px-4 sm:px-8 py-3 flex items-center justify-between"
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
          {`${pg(spreadIdx + 1)} / ${pg(totalSpreads)}`}
        </div>
      </div>

      <BookFlip
        ref={bookFlipRef}
        book={book}
        recipes={recipes}
        isOwner={isOwner}
        flipType={flipType}
        onSpreadChange={setSpreadIdx}
        onClose={handleBack}
      />

      <BookFAB
        context={fabContext}
        book={book}
        recipe={currentRecipe}
        isOwner={isOwner}
        onBackToToC={backToToC}
      />
    </div>
  );
}
