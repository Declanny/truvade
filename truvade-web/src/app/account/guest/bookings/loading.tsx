import { Skeleton } from "@/components/ui";

export default function BookingsLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      <Skeleton className="h-8 w-40 mb-6" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 flex gap-4">
            <Skeleton className="w-28 h-28 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
