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
    xs: { w: 120, h: 168, title: "text-sm",  tag: "text-[7px]",  sub: "text-[8px]",  frame: "py-3 px-2",   spine: 14, by: 6 },
    sm: { w: 160, h: 220, title: "text-base", tag: "text-[7.5px]", sub: "text-[8.5px]", frame: "py-4 px-2.5", spine: 18, by: 7 },
    md: { w: 240, h: 320, title: "text-2xl", tag: "text-[8.5px]", sub: "text-[9.5px]", frame: "py-7 px-3",   spine: 22, by: 8.5 },
    lg: { w: 300, h: 400, title: "text-3xl", tag: "text-[9.5px]", sub: "text-[10.5px]", frame: "py-9 px-4",  spine: 26, by: 9.5 },
    xl: { w: 390, h: 540, title: "text-4xl", tag: "text-[11px]",  sub: "text-[12px]",   frame: "py-12 px-5", spine: 32, by: 11 },
  }[size];

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
              top: size === "xs" ? 6 : 10,
              right: size === "xs" ? 14 : 20,
              width: size === "xs" ? 30 : 52,
              height: size === "xs" ? 10 : 18,
              background: "linear-gradient(90deg,rgba(212,184,150,.6),rgba(232,208,172,.7),rgba(212,184,150,.6))",
              transform: "rotate(9deg)",
              boxShadow: "0 1px 3px rgba(0,0,0,.1)",
            }}
          />


          {/* Frame + author stacked — mirrors BookReaderV2 layout */}
          <div className="mx-3" style={{ width: `calc(100% - 1.5rem)` }}>
            <div className={`border border-white/22 text-center text-white flex flex-col items-center justify-center gap-2 w-full ${DIMS.frame}`}>
              {book.tagline && (
                <>
                  <p className={`${DIMS.tag} tracking-[.38em] text-white/48 uppercase truncate w-full`}>
                    {book.tagline}
                  </p>
                  <div className="w-7 h-px bg-white/20" />
                </>
              )}
              <h2 className={`${DIMS.title} font-bold leading-tight break-words w-full`}>
                {book.title}
              </h2>
              {book.subtitle && (
                <>
                  <div className="w-7 h-px bg-white/20" />
                  <p className={`${DIMS.sub} text-white/55 line-clamp-2 break-words w-full px-1`}>
                    {book.subtitle}
                  </p>
                </>
              )}
            </div>

            {/* Author — directly below the title frame, left-aligned */}
            {author && (
              <div className="mt-1 px-1">
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
                    style={{ fontSize: DIMS.by, fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    by {author}
                  </span>
                ) : (
                  <p
                    className="text-white/50 italic tracking-widest"
                    style={{ fontSize: DIMS.by, fontFamily: "Georgia, 'Times New Roman', serif" }}
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
            bottom: 8,
            right: 8,
            background: "rgba(255,255,255,0.95)",
            color: "#16a34a",
            fontSize: size === "xs" ? 8 : 10,
            padding: size === "xs" ? "2px 6px" : "2px 8px",
            borderRadius: 9999,
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 600,
          }}
        >
          <Globe style={{ width: size === "xs" ? 8 : 10, height: size === "xs" ? 8 : 10 }} />
          แชร์ {publicCount}
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
