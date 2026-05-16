export default function UpdatesLoading() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="skeleton h-4 w-28 rounded mb-6" />

      <div className="mb-8 space-y-2">
        <div className="skeleton h-8 w-40 rounded-lg" />
        <div className="skeleton h-4 w-72 rounded" />
      </div>

      <div className="space-y-4">
        {/* Latest entry — taller, has accent bar */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-2">
              <div className="skeleton h-6 w-20 rounded-lg" />
              <div className="skeleton h-5 w-12 rounded-full" />
            </div>
            <div className="skeleton h-3 w-28 rounded" />
          </div>
          <div className="skeleton h-4 w-56 rounded" />
          <div className="space-y-2">
            <div className="skeleton h-5 w-20 rounded-md" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-5/6 rounded" />
            <div className="skeleton h-3 w-4/5 rounded" />
          </div>
          <div className="space-y-2">
            <div className="skeleton h-5 w-16 rounded-md" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-3/4 rounded" />
          </div>
        </div>

        {/* Shorter cards */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="skeleton h-6 w-20 rounded-lg" />
              <div className="skeleton h-3 w-28 rounded" />
            </div>
            <div className="skeleton h-4 w-48 rounded" />
            <div className="space-y-1.5">
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-4/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
