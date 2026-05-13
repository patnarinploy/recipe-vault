import { Globe } from "lucide-react";
import type { Book } from "@/lib/types";

/**
 * Shared book cover — used in library grid (size="sm"), book open page,
 * and the book-reader header. Entirely presentational.
 */
export default function BookCover({
  book,
  size = "md",
  publicCount = 0,
  author,
  onAuthorClick,
  className = "",
  onClick,
}: {
  book: Book;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  publicCount?: number;
  author?: string;
  onAuthorClick?: () => void;
  className?: string;
  onClick?: () => void;
}) {
  const DIMS = {
    xs: { w: 120, h: 168, spine: 14 },
    sm: { w: 160, h: 220, spine: 18 },
    md: { w: 240, h: 320, spine: 22 },
    lg: { w: 300, h: 400, spine: 26 },
    xl: { w: 390, h: 540, spine: 32 },
  }[size];

  // All typography and spacing derived proportionally from cover dimensions.
  // Anchored to the xl face (faceW=358, h=540) — same baseline as PageCoverFront.
  const faceW     = DIMS.w - DIMS.spine;
  const titlePx   = Math.max(13, Math.round(faceW * 0.115));
  const tagPx     = Math.max(7,  Math.round(titlePx * 0.30));
  const subPx     = Math.max(7,  Math.round(titlePx * 0.33));
  const byPx      = Math.max(6,  Math.round(titlePx * 0.26));
  const framePyPx = Math.round(DIMS.h  * 0.08);
  const framePxPx = Math.round(faceW   * 0.06);
  const gapPx     = Math.max(4,  Math.round(DIMS.h  * 0.025));
  const authorMt  = Math.max(2,  Math.round(DIMS.h  * 0.010));
  const washiTop  = Math.max(4,  Math.round(DIMS.h  * 0.020));
  const washiRight= Math.max(12, Math.round(faceW   * 0.130));
  const washiW    = Math.max(24, Math.round(faceW   * 0.145));
  const washiH    = Math.max(8,  Math.round(DIMS.h  * 0.033));

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={`relative shrink-0 select-none ${onClick ? "cursor-pointer group" : ""} ${className}`}
      style={{ width: DIMS.w, height: DIMS.h }}
    >
      {/* Drop shadow */}
      <div
        className="absolute -bottom-2 left-3 right-3 h-4 rounded-full opacity-25 pointer-events-none"
        style={{ background: "#444", filter: "blur(14px)" }}
      />

      {/* Book body */}
      <div
        className={`relative w-full h-full flex overflow-hidden transition-transform duration-300 ${
          onClick ? "group-hover:-translate-y-1 group-hover:shadow-2xl" : ""
        }`}
        style={{
          borderRadius: "2px 6px 6px 2px",
          boxShadow: "5px 10px 36px rgba(0,0,0,.28), -2px 0 10px rgba(0,0,0,.14)",
        }}
      >
        {/* Spine */}
        <div
          className="shrink-0 flex items-center justify-center relative overflow-hidden"
          style={{
            width: DIMS.spine,
            background: `linear-gradient(to right, ${darken(book.cover_color, 20)}, ${book.cover_color})`,
          }}
        >
          {[1].map(p => (
            <div key={p} className="absolute top-0 bottom-0 right-0 pointer-events-none"
                 style={{ width: 1, background: "rgba(255,255,255,0.28)" }} />
          ))}
          <span
            className="text-white/35 tracking-[.4em] truncate relative z-10"
            style={{ writingMode: "vertical-rl", fontSize: size === "xs" ? 6 : 7.5 }}
          >
            {book.title.slice(0, 18).toUpperCase()}
          </span>
        </div>

        {/* Face */}
        <div
          className="flex-1 flex items-center justify-center relative"
          style={{ background: book.cover_color }}
        >
          {/* Washi tape */}
          <div
            className="absolute rounded-sm pointer-events-none"
            style={{
              top: washiTop, right: washiRight, width: washiW, height: washiH,
              background: "linear-gradient(90deg,rgba(212,184,150,.6),rgba(232,208,172,.7),rgba(212,184,150,.6))",
              transform: "rotate(9deg)",
              boxShadow: "0 1px 3px rgba(0,0,0,.1)",
            }}
          />


          {/* Frame + author stacked — mirrors BookReaderV2 layout */}
          <div className="mx-3" style={{ width: `calc(100% - 1.5rem)` }}>
            <div className="border border-white/22 text-center text-white flex flex-col items-center justify-center w-full"
                 style={{ padding: `${framePyPx}px ${framePxPx}px`, gap: gapPx }}>
              {book.tagline && (
                <>
                  <p className="tracking-[.38em] text-white/48 uppercase truncate w-full"
                     style={{ fontSize: tagPx }}>
                    {book.tagline}
                  </p>
                  <div className="w-7 h-px bg-white/20" />
                </>
              )}
              <h2 className="font-bold leading-tight break-words w-full"
                  style={{ fontSize: titlePx }}>
                {book.title}
              </h2>
              {book.subtitle && (
                <>
                  <div className="w-7 h-px bg-white/20" />
                  <p className="text-white/55 line-clamp-2 break-words w-full px-1"
                     style={{ fontSize: subPx }}>
                    {book.subtitle}
                  </p>
                </>
              )}
            </div>

            {/* Author — directly below the title frame, left-aligned */}
            {author && (
              <div className="px-1" style={{ marginTop: authorMt }}>
                {onAuthorClick ? (
                  // Must NOT be <button> here — the outer Wrapper is already a <button>,
                  // and nested buttons are invalid HTML; the browser rewrites the DOM,
                  // causing React hydration error #418 on page refresh.
                  <span
                    role="button"
                    tabIndex={0}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onAuthorClick(); }}
                    className="text-white/50 hover:text-white/80 italic tracking-widest transition-colors cursor-pointer"
                    style={{ fontSize: byPx, fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    by {author}
                  </span>
                ) : (
                  <p
                    className="text-white/50 italic tracking-widest"
                    style={{ fontSize: byPx, fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    by {author}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shared badge — outside overflow-hidden to avoid Safari clipping */}
      {publicCount > 0 && (
        <div
          className="absolute z-10 pointer-events-none whitespace-nowrap"
          style={{
            bottom: 8, right: 8,
            background: "rgba(255,255,255,0.95)",
            color: "#16a34a",
            fontSize: size === "xs" ? 8 : 10,
            padding: size === "xs" ? "2px 6px" : "2px 8px",
            borderRadius: 9999,
            display: "flex", alignItems: "center",
            gap: 4,
            fontWeight: 600,
          }}
        >
          <Globe style={{ width: size === "xs" ? 8 : 10, height: size === "xs" ? 8 : 10 }} />
          Shared {publicCount}
        </div>
      )}
    </Wrapper>
  );
}

// Darken hex color by percentage
function darken(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - percent);
  const g = Math.max(0, ((num >> 8) & 0xff) - percent);
  const b = Math.max(0, (num & 0xff) - percent);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
