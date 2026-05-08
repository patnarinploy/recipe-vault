import { SkeletonBookGrid } from "@/components/Skeleton";

// Instant Suspense fallback for the homepage while server data loads.
export default function Loading() {
  return (
    <div className="anim-fade-up">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-8 w-64 rounded-lg" />
          <div className="skeleton h-4 w-40 rounded" />
        </div>
      </div>

      {/* Tab skeleton */}
      <div className="flex gap-2 mb-8 border-b border-stone-200">
        <div className="skeleton h-10 w-28 rounded-t-lg" />
        <div className="skeleton h-10 w-28 rounded-t-lg opacity-50" />
      </div>

      {/* Book grid skeleton */}
      <SkeletonBookGrid count={8} />
    </div>
  );
}
