// Matches real AccountForm: email readonly + contact (tel) + personal (dob/country/lang) + social links + save
export default function AccountLoading() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="skeleton h-4 w-16 rounded mb-6" />
      <div className="skeleton h-8 w-32 rounded-lg mb-1" />
      <div className="skeleton h-4 w-64 rounded mb-6" />

      {/* Email (readonly) */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 mb-5">
        <div className="skeleton h-3.5 w-16 rounded mb-1.5" />
        <div className="skeleton h-3 w-52 rounded mb-3" />
        <div className="skeleton h-10 w-full rounded-xl" />
      </div>

      {/* Contact: tel */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 mb-5">
        <div className="skeleton h-3.5 w-20 rounded mb-4" />
        <div className="skeleton h-3.5 w-28 rounded mb-1.5" />
        <div className="skeleton h-10 w-full rounded-xl" />
      </div>

      {/* Personal: dob + country + language */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-4 mb-5">
        <div className="skeleton h-3.5 w-24 rounded" />
        {["w-24", "w-20", "w-28"].map((lw, i) => (
          <div key={i}>
            <div className={`skeleton h-3.5 ${lw} rounded mb-1.5`} />
            <div className="skeleton h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* Social links: 4 inputs */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-4 mb-5">
        <div className="skeleton h-3.5 w-24 rounded" />
        {["w-20", "w-24", "w-20", "w-28"].map((lw, i) => (
          <div key={i}>
            <div className={`skeleton h-3.5 ${lw} rounded mb-1.5`} />
            <div className="skeleton h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="skeleton h-12 w-full rounded-xl" />
    </div>
  );
}
