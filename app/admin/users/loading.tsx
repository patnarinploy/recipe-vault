export default function AdminUsersLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="skeleton h-4 w-36 rounded mb-6" />
      <div className="skeleton h-8 w-40 rounded-lg mb-6" />
      <div className="skeleton h-10 w-full rounded-xl mb-5" />

      {/* Your Account section */}
      <div className="mb-5">
        <div className="skeleton h-3 w-24 rounded mb-2" />
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          <SkeletonUserRow showActions={false} />
        </div>
      </div>

      {/* All Users section */}
      <div>
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-3 w-10 rounded" />
        </div>
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonUserRow key={i} showActions />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonUserRow({ showActions }: { showActions: boolean }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className="skeleton w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="skeleton h-3.5 w-32 rounded" />
        <div className="skeleton h-3 w-48 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
      {showActions && (
        <div className="flex gap-1 shrink-0">
          <div className="skeleton w-7 h-7 rounded-lg" />
          <div className="skeleton w-7 h-7 rounded-lg" />
        </div>
      )}
    </div>
  );
}
