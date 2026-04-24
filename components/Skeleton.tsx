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

export function SkeletonBookReader() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-4 w-20" />
      </div>
      <div className="flex rounded-sm border border-[#e0cdb4] overflow-hidden shadow-xl">
        <div className="flex-1 bg-[#fef9f0] p-8 min-h-[520px] space-y-4">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-8 w-56" />
          <div className="space-y-2 pt-4">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-4 w-4/5" />
          </div>
        </div>
        <div className="flex-1 bg-[#fef9f0] p-8 min-h-[520px] space-y-4">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-40 w-full rounded-md" />
          <div className="space-y-2 pt-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
