export default function ToursLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="skeleton h-4 w-16 rounded mb-6" />
      <div className="skeleton h-8 w-52 rounded-lg mb-1" />
      <div className="skeleton h-3.5 w-72 rounded mb-6" />
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        {[0, 1].map(i => (
          <div key={i} className="flex items-center gap-3.5 px-5 py-4 border-b border-border last:border-0">
            <div className="skeleton w-11 h-6 rounded-full shrink-0" />
            <div className="skeleton w-8 h-8 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3.5 w-40 rounded" />
              <div className="skeleton h-3 w-64 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
