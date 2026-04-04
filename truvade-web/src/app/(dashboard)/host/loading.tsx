import { Skeleton, TableSkeleton } from "@/components/ui";

export default function HostDashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-8">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-52 rounded-lg" />
        ))}
      </div>

      {/* Bookings */}
      <TableSkeleton rows={4} cols={4} />
    </div>
  );
}
