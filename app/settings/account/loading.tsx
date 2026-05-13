// Matches real AccountForm: username readonly + role badge + email + tel fields
export default function AccountLoading() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="skeleton h-4 w-16 rounded mb-6" />
      <div className="skeleton h-8 w-32 rounded-lg mb-1" />
      <div className="skeleton h-4 w-64 rounded mb-6" />

      {/* Username card (readonly) */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-1">
          <div className="skeleton h-3.5 w-40 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
        <div className="skeleton h-3 w-44 rounded mb-3" />
        <div className="skeleton h-10 w-full rounded-xl" />
      </div>

      {/* Role */}
      <div className="mb-5">
        <div className="skeleton h-3.5 w-10 rounded mb-1" />
        <div className="skeleton h-3 w-28 rounded mb-3" />
        <div className="skeleton h-7 w-24 rounded-full" />
      </div>

      {/* Email + Tel */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-4 mb-5">
        {["อีเมล", "เบอร์โทรศัพท์"].map((_, i) => (
          <div key={i}>
            <div className="skeleton h-3.5 w-16 rounded mb-1.5" />
            <div className="skeleton h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="skeleton h-12 w-full rounded-xl" />
    </div>
  );
}
