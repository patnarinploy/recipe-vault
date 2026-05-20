export default function AdminLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="skeleton h-4 w-28 rounded mb-6" />

      <div className="flex items-end justify-between mb-6">
        <div className="space-y-1.5">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-8 w-52 rounded-lg" />
        </div>
        <div className="skeleton h-3 w-24 rounded" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 bg-surface rounded-2xl border border-border px-5 py-4">
            <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-56 rounded" />
            </div>
            <div className="skeleton h-3 w-12 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
