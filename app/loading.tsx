import { SkeletonBookGrid } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="anim-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-8 w-64 rounded-lg" />
          <div className="skeleton h-4 w-40 rounded" />
        </div>
      </div>

      <div className="flex gap-2 mb-8 border-b border-border">
        <div className="skeleton h-10 w-28 rounded-t-lg" />
        <div className="skeleton h-10 w-28 rounded-t-lg opacity-50" />
      </div>

      <SkeletonBookGrid count={8} />
    </div>
  );
}
