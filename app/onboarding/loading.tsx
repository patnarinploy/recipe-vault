// Mirrors actual OnboardingForm layout to prevent layout shift
export default function OnboardingLoading() {
  return (
    <div className="max-w-lg mx-auto py-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
          <div className="skeleton h-7 w-40 rounded-lg" />
        </div>
        <div className="skeleton h-4 w-64 rounded ml-12 mt-1" />
      </div>

      {/* Avatar card */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 mb-5">
        <div className="skeleton h-4 w-14 rounded mb-1" />
        <div className="skeleton h-3 w-52 rounded mb-5" />
        {/* Avatar preview circle */}
        <div className="flex justify-center mb-6">
          <div className="skeleton w-24 h-24 rounded-full" />
        </div>
        {/* Preset grid */}
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-full" />
          ))}
        </div>
      </div>

      {/* Name + Bio card */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-4 mb-5">
        <div>
          <div className="skeleton h-3.5 w-16 rounded mb-1" />
          <div className="skeleton h-3 w-52 rounded mb-2" />
          <div className="skeleton h-10 w-full rounded-xl" />
        </div>
        <div>
          <div className="skeleton h-3.5 w-24 rounded mb-1" />
          <div className="skeleton h-3 w-44 rounded mb-2" />
          <div className="skeleton h-24 w-full rounded-xl" />
        </div>
      </div>

      {/* Submit button */}
      <div className="skeleton h-12 w-full rounded-xl" />
    </div>
  );
}
