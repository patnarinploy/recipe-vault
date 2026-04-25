export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`skeleton ${className}`} style={style} />;
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
