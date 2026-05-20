// Matches real ReadingPage: 4 cards — page flip, theme, language, reading font grid
export default function ReadingLoading() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="skeleton h-4 w-16 rounded mb-6" />
      <div className="skeleton h-8 w-44 rounded-lg mb-6" />

      <div className="space-y-4">
        {/* Page flip card */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <div className="skeleton h-3.5 w-36 rounded" />
              <div className="skeleton h-3 w-56 rounded" />
            </div>
          </div>
          <div className="skeleton h-12 w-full rounded-xl mb-3" />
          <div className="skeleton h-3 w-72 rounded" />
        </div>

        {/* Theme card */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <div className="skeleton h-3.5 w-28 rounded" />
              <div className="skeleton h-3 w-48 rounded" />
            </div>
          </div>
          <div className="skeleton h-12 w-full rounded-xl" />
        </div>

        {/* Language card */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <div className="skeleton h-3.5 w-24 rounded" />
              <div className="skeleton h-3 w-52 rounded" />
            </div>
          </div>
          <div className="skeleton h-12 w-full rounded-xl" />
        </div>

        {/* Reading font card — 1-col grid on mobile */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <div className="skeleton h-3.5 w-32 rounded" />
              <div className="skeleton h-3 w-60 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
