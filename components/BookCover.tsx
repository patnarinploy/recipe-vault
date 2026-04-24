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
  className = "",
  onClick,
}: {
  book: Book;
  size?: "xs" | "sm" | "md" | "lg";
  publicCount?: number;
  className?: string;
  onClick?: () => void;
}) {
  const DIMS = {
    xs: { w: 120, h: 168, title: "text-sm",  tag: "text-[7px]",  sub: "text-[8px]",  frame: "py-3 px-2", spine: 14 },
    sm: { w: 160, h: 220, title: "text-base", tag: "text-[7.5px]", sub: "text-[8.5px]", frame: "py-4 px-2.5", spine: 18 },
    md: { w: 240, h: 320, title: "text-2xl", tag: "text-[8.5px]", sub: "text-[9.5px]", frame: "py-7 px-3",   spine: 22 },
    lg: { w: 300, h: 400, title: "text-3xl", tag: "text-[9.5px]", sub: "text-[10.5px]", frame: "py-9 px-4",  spine: 26 },
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
          className="shrink-0 flex items-center justify-center"
          style={{
            width: DIMS.spine,
            background: `linear-gradient(to right, ${darken(book.cover_color, 20)}, ${book.cover_color})`,
          }}
        >
          <span
            className="text-white/35 tracking-[.4em] truncate"
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

          {/* Shared badge */}
          {publicCount > 0 && (
            <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm text-green-600 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
              <Globe className="w-3 h-3" /> แชร์ {publicCount}
            </div>
          )}

          {/* Frame */}
          <div className={`border border-white/22 text-center text-white flex flex-col items-center justify-center gap-2 mx-3 ${DIMS.frame}`}
               style={{ width: `calc(100% - 1.5rem)` }}>
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
        </div>
      </div>
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
