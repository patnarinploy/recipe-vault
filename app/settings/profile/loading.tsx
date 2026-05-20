// Matches real ProfileForm layout: avatar section + public info fields
export default function ProfileLoading() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="skeleton h-4 w-16 rounded mb-6" />
      <div className="skeleton h-8 w-44 rounded-lg mb-1" />
      <div className="skeleton h-4 w-72 rounded mb-6" />

      {/* Avatar card */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 mb-5">
        <div className="skeleton h-3.5 w-14 rounded mb-1.5" />
        <div className="skeleton h-3 w-52 rounded mb-5" />
        <div className="flex justify-center mb-6">
          <div className="skeleton w-24 h-24 rounded-full" />
        </div>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-full" />
          ))}
        </div>
      </div>

      {/* Public info fields */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-5 mb-5">
        {[["w-14", false], ["w-24", true]].map(([lw, textarea], i) => (
          <div key={i}>
            <div className={`skeleton h-3.5 ${lw} rounded mb-1.5`} />
            {textarea
              ? <div className="skeleton h-24 w-full rounded-xl" />
              : <div className="skeleton h-10 w-full rounded-xl" />
            }
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="skeleton h-12 w-full rounded-xl" />
    </div>
  );
}
