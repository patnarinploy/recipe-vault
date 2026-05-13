// Matches real PasswordPage: white card with icon header + 3 password fields
export default function PasswordLoading() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="skeleton h-4 w-16 rounded mb-6" />
      <div className="skeleton h-8 w-28 rounded-lg mb-6" />

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        {/* Icon header */}
        <div className="flex items-center gap-2.5 mb-6 pb-5 border-b border-stone-100">
          <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
          <div className="space-y-1.5">
            <div className="skeleton h-3.5 w-32 rounded" />
            <div className="skeleton h-3 w-52 rounded" />
          </div>
        </div>

        {/* 3 password inputs */}
        <div className="space-y-4">
          {["w-28", "w-24", "w-36"].map((lw, i) => (
            <div key={i}>
              <div className={`skeleton h-3.5 ${lw} rounded mb-1.5`} />
              <div className="skeleton h-10 w-full rounded-xl" />
              {i === 1 && <div className="skeleton h-3 w-32 rounded mt-1.5" />}
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="skeleton h-12 w-full rounded-xl mt-4" />
      </div>
    </div>
  );
}
