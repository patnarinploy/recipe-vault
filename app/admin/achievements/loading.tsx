export default function AdminAchievementsLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="skeleton h-4 w-36 rounded mb-6" />
      <div className="skeleton h-8 w-56 rounded-lg mb-6" />

      {/* Tier legend skeleton */}
      <div className="bg-white rounded-2xl border border-stone-100 px-5 py-4 mb-6 space-y-3">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-6 w-14 rounded-full" />
          ))}
        </div>
      </div>

      {/* Section skeletons */}
      {Array.from({ length: 4 }).map((_, s) => (
        <div key={s} className="mb-6">
          <div className="flex items-center gap-2 px-1 mb-2">
            <div className="skeleton w-5 h-5 rounded" />
            <div className="space-y-1">
              <div className="skeleton h-3.5 w-24 rounded" />
              <div className="skeleton h-3 w-40 rounded" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-100 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="skeleton h-5 w-12 rounded-md shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="skeleton h-5 w-28 rounded-full" />
                  <div className="skeleton h-3 w-48 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
