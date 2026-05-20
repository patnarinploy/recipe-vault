export default function ShoppingLoading() {
  return (
    <div className="max-w-2xl mx-auto anim-fade-up">
      <div className="skeleton h-4 w-28 rounded mb-6" />
      <div className="flex items-center justify-between mb-6">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-8 w-24 rounded-lg" />
      </div>
      <div className="flex gap-1 mb-6 border-b border-border">
        <div className="skeleton h-9 w-32 rounded-t-lg" />
        <div className="skeleton h-9 w-32 rounded-t-lg opacity-50" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-surface rounded-2xl border border-border p-4 space-y-3">
            <div className="flex gap-3">
              <div className="skeleton w-16 h-16 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
              <div className="skeleton h-8 w-8 rounded-lg" />
            </div>
            <div className="skeleton h-9 w-36 rounded-xl mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
