import AdminLayout from "@/components/admin/AdminLayout";

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[1fr_1fr_5rem] gap-3 items-center px-4 py-2.5 border-b border-border last:border-0">
      <div className="h-4 w-28 bg-elevated rounded animate-pulse" />
      <div className="h-4 w-20 bg-elevated rounded animate-pulse" />
      <div className="flex gap-1 justify-end">
        <div className="w-7 h-7 rounded-lg bg-elevated animate-pulse" />
        <div className="w-7 h-7 rounded-lg bg-elevated animate-pulse" />
      </div>
    </div>
  );
}

export default function AdminDropdownsLoading() {
  return (
    <AdminLayout title="" backLabel="">
      {/* Title skeleton */}
      <div className="h-7 w-40 bg-elevated rounded-lg animate-pulse mb-6" />

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border mb-6">
        <div className="h-9 w-24 bg-elevated rounded-t-lg animate-pulse" />
        <div className="h-9 w-24 bg-elevated rounded-t-lg animate-pulse opacity-50" />
      </div>

      {/* Table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden mb-4">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_5rem] gap-3 px-4 py-2.5 border-b border-border bg-elevated">
          <div className="h-3 w-20 bg-border rounded animate-pulse" />
          <div className="h-3 w-20 bg-border rounded animate-pulse" />
          <span />
        </div>
        {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>

      {/* Add button */}
      <div className="h-5 w-24 bg-elevated rounded animate-pulse" />
    </AdminLayout>
  );
}
