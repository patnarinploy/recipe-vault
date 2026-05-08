import { SkeletonSettingsRows } from "@/components/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-lg mx-auto">
      {/* Back link skeleton */}
      <div className="skeleton h-4 w-24 rounded mb-6" />

      {/* Page title skeleton */}
      <div className="skeleton h-8 w-20 rounded-lg mb-6" />

      {/* Writer card skeleton */}
      <div className="mb-6">
        <div className="skeleton h-3 w-20 rounded mb-2" />
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="skeleton w-14 h-14 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-3 w-48 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Nav group skeletons */}
      <div className="space-y-6">
        {[2, 1, 1].map((count, i) => (
          <div key={i}>
            <div className="skeleton h-3 w-16 rounded mb-2 px-1" />
            <SkeletonSettingsRows count={count} />
          </div>
        ))}
      </div>
    </div>
  );
}
