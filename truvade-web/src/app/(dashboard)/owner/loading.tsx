import { Skeleton, TableSkeleton } from "@/components/ui";

export default function OwnerDashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-8">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-56 rounded-lg" />
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-36 rounded-lg" />
        ))}
      </div>

      {/* Table */}
      <TableSkeleton rows={5} cols={4} />
    </div>
  );
}
