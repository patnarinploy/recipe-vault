import { SkeletonSettingsRows } from "@/components/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="skeleton h-4 w-24 rounded mb-6" />
      <div className="skeleton h-8 w-20 rounded-lg mb-6" />

      {/* Writer card preview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-3 w-10 rounded" />
        </div>
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-stone-800 dark:via-stone-800 dark:to-stone-800 rounded-2xl p-6 border border-orange-100 dark:border-stone-700 text-center">
          <div className="flex justify-center mb-4">
            <div className="skeleton w-20 h-20 rounded-full" />
          </div>
          <div className="skeleton h-5 w-36 rounded mx-auto mb-1" />
          <div className="w-10 h-px bg-orange-200 dark:bg-stone-600/60 mx-auto mt-4 mb-4" />
          <div className="skeleton h-3 w-28 rounded-full mx-auto" />
        </div>
      </div>

      {/* Nav group skeletons */}
      <div className="space-y-6">
        {[2, 1, 1].map((count, i) => (
          <div key={i}>
            <div className="skeleton h-3 w-16 rounded mb-2" />
            <SkeletonSettingsRows count={count} />
          </div>
        ))}
      </div>
    </div>
  );
}
