import type { CSSProperties } from "react";

export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return <div className={`skeleton ${className}`} style={style} />;
}

// Generic field row: label bar + input bar
function SkeletonField({ wide = false }: { wide?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`skeleton h-3 rounded ${wide ? "w-28" : "w-20"}`} />
      <div className="skeleton h-10 rounded-xl w-full" />
    </div>
  );
}

// Skeleton for any create/edit form — 3 fields + submit button
export function SkeletonForm() {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-6 space-y-5">
      <div className="skeleton h-5 w-36 rounded mb-2" />
      <SkeletonField wide />
      <SkeletonField />
      <SkeletonField wide />
      <div className="flex justify-end gap-2 pt-2">
        <div className="skeleton h-10 w-20 rounded-xl" />
        <div className="skeleton h-10 w-24 rounded-xl" style={{ opacity: 0.7 }} />
      </div>
    </div>
  );
}

// Skeleton for settings nav rows
export function SkeletonSettingsRows({ count = 3 }: { count?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm divide-y divide-stone-100 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3.5 px-5 py-4">
          <div className="skeleton w-8 h-8 rounded-xl shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="skeleton h-3.5 w-28 rounded" />
            <div className="skeleton h-3 w-44 rounded" />
          </div>
          <div className="skeleton w-4 h-4 rounded shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonBookTile() {
  return (
    <div className="flex flex-col items-center">
      <div
        className="skeleton-dark w-40 h-[220px]"
        style={{ borderRadius: "2px 6px 6px 2px" }}
      />
      <div className="mt-4 skeleton h-3.5 w-24" />
      <div className="mt-1.5 skeleton h-3 w-14" />
    </div>
  );
}

export function SkeletonBookGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10 justify-items-center">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBookTile key={i} />
      ))}
    </div>
  );
}

// Solid shimmer colours for use against any background (including dark modal overlay).
const PAGE_SHIMMER = "linear-gradient(90deg,#e0dbd7 0%,#ede9e5 50%,#e0dbd7 100%)";
const LINE_SHIMMER = "linear-gradient(90deg,#cac5c1 0%,#d8d2ce 50%,#cac5c1 100%)";
const SHIMMER_ANIM = "skeleton-shimmer 1.4s linear infinite";

// Open-book shimmer for V2 modal loading state.
// Accepts exact page dimensions from usePageDimensions() so the skeleton
// occupies the same spatial footprint as the real book — no resize jump on load.
export function SkeletonOpenBook({
  pageW = 390,
  pageH = 540,
  portrait = false,
}: {
  pageW?: number;
  pageH?: number;
  portrait?: boolean;
}) {
  const spreadW   = portrait ? pageW : pageW * 2 + 3;
  const lineH     = Math.max(4,  Math.round(pageH * 0.030));
  const blockH    = Math.max(40, Math.round(pageH * 0.200));
  const gap       = Math.max(6,  Math.round(pageH * 0.045));
  const padX      = Math.round(pageW * 0.10);
  const padTop    = Math.round(pageH * 0.12);

  const shimPage: CSSProperties = {
    width: pageW, height: pageH, flexShrink: 0,
    background: PAGE_SHIMMER, backgroundSize: "200% 100%", animation: SHIMMER_ANIM,
  };
  const shimLine = (w: string): CSSProperties => ({
    width: w, height: lineH, borderRadius: 4,
    background: LINE_SHIMMER, backgroundSize: "200% 100%", animation: SHIMMER_ANIM,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "stretch", filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.35))" }}>
        {!portrait && (
          <>
            <div style={{ ...shimPage, borderRadius: "6px 0 0 6px" }} />
            <div style={{ width: 3, flexShrink: 0, background: "#b8b2ac" }} />
          </>
        )}
        {/* Right / only page — content shimmer with line placeholders */}
        <div style={{
          ...shimPage, position: "relative", overflow: "hidden",
          borderRadius: portrait ? "6px" : "0 6px 6px 0",
        }}>
          <div style={{ position: "absolute", left: padX, right: padX, top: padTop, display: "flex", flexDirection: "column", gap }}>
            {[0.60, 0.80, 0.66].map((w, i) => <div key={i} style={shimLine(`${w * 100}%`)} />)}
            <div style={{ width: "100%", height: blockH, marginTop: Math.round(gap * 0.5), borderRadius: 6, background: LINE_SHIMMER, backgroundSize: "200% 100%", animation: SHIMMER_ANIM }} />
            {[0.50, 0.75, 0.63].map((w, i) => <div key={i} style={shimLine(`${w * 100}%`)} />)}
          </div>
        </div>
      </div>
      {/* Ground shadow */}
      <div style={{ width: spreadW, height: 14, marginTop: 2, borderRadius: "50%", background: "#222", filter: "blur(18px)", opacity: 0.5 }} />
    </div>
  );
}

// Book-cover-shaped shimmer shown while BookReaderModal loads data
export function SkeletonBookCover() {
  return (
    <div
      className="flex items-center justify-center px-4"
      style={{ minHeight: "calc(100dvh - 4rem)" }}
    >
      <div
        className="relative flex-shrink-0"
        style={{ width: "min(390px, 88vw)" }}
      >
        {/* Book body */}
        <div
          className="skeleton-dark w-full"
          style={{
            aspectRatio: "390 / 540",
            borderRadius: "2px 8px 8px 2px",
          }}
        >
          {/* Spine strip */}
          <div
            className="absolute top-0 left-0 bottom-0"
            style={{
              width: "8.2%",
              background: "rgba(0,0,0,.18)",
              borderRadius: "2px 0 0 2px",
            }}
          />
          {/* Faint horizontal shimmer lines to suggest content */}
          <div className="absolute inset-x-[14%] top-[14%] flex flex-col gap-[6%]">
            <div className="h-[5%] rounded skeleton" style={{ opacity: 0.35 }} />
            <div className="h-[3%] w-4/5 rounded skeleton" style={{ opacity: 0.25 }} />
            <div className="h-[3%] w-2/3 rounded skeleton" style={{ opacity: 0.25 }} />
          </div>
        </div>
        {/* Drop shadow */}
        <div
          className="absolute -bottom-3 left-[10%] right-[5%] h-6 rounded-full pointer-events-none"
          style={{ background: "#555", filter: "blur(12px)", opacity: 0.2 }}
        />
      </div>
    </div>
  );
}
