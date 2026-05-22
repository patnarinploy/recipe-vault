export default function PresetsLoading() {
  return (
    <div className="max-w-lg mx-auto">
      {/* Back link */}
      <div className="skeleton h-4 w-20 rounded mb-6" />

      {/* Title + subtitle */}
      <div className="skeleton h-8 w-48 rounded-lg mb-2" />
      <div className="skeleton h-4 w-72 rounded mb-8" />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {[28, 16, 20].map((w, i) => (
          <div key={i} className={`px-4 py-2.5`}>
            <div className={`skeleton h-4 w-${w} rounded`} />
          </div>
        ))}
      </div>

      {/* Search + Add row */}
      <div className="flex items-center gap-2 mb-4">
        <div className="skeleton h-9 flex-1 rounded-xl" />
        <div className="skeleton h-4 w-20 rounded" />
      </div>

      {/* Table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_1fr_5rem] gap-3 px-4 py-2.5 border-b border-border bg-elevated">
          <div className="skeleton h-3 w-8 rounded" />
          <div className="skeleton h-3 w-8 rounded" />
          <span />
        </div>
        {/* Rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_5rem] gap-3 items-center px-4 py-3 border-b border-border last:border-0">
            <div className="skeleton h-4 rounded" style={{ width: `${55 + (i % 3) * 15}%` }} />
            <div className="skeleton h-4 rounded" style={{ width: `${40 + (i % 4) * 12}%` }} />
            <div className="flex gap-1 justify-end">
              <div className="skeleton w-6 h-6 rounded-lg" />
              <div className="skeleton w-6 h-6 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      <div className="skeleton h-3 w-32 rounded mt-4" />
    </div>
  );
}
