// Matches real ReadingPage: white card with icon header + 2-button flip-type toggle
export default function ReadingLoading() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="skeleton h-4 w-16 rounded mb-6" />
      <div className="skeleton h-8 w-44 rounded-lg mb-6" />

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        {/* Icon header */}
        <div className="flex items-center gap-2.5 mb-6 pb-5 border-b border-stone-100">
          <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
          <div className="space-y-1.5">
            <div className="skeleton h-3.5 w-36 rounded" />
            <div className="skeleton h-3 w-60 rounded" />
          </div>
        </div>

        {/* 2-button toggle */}
        <div className="skeleton h-12 w-full rounded-xl mb-3" />
        <div className="skeleton h-3 w-72 rounded" />
      </div>
    </div>
  );
}
