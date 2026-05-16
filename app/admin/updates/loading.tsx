export default function AdminUpdatesLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="skeleton h-4 w-36 rounded mb-6" />
      <div className="skeleton h-8 w-40 rounded-lg mb-2" />
      <div className="skeleton h-4 w-64 rounded mb-6" />

      <div className="space-y-4">
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
          </div>
          <div className="space-y-2">
            <div className="skeleton h-5 w-16 rounded-md" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-3/4 rounded" />
          </div>
        </div>

        {Array.from({ length: 4 }).map((_, i) => (
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
