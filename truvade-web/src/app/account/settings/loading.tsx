import { Skeleton } from "@/components/ui";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56 mb-2" />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-start justify-between py-6 border-b border-gray-100">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3.5 w-48" />
          </div>
          <Skeleton className="h-4 w-10" />
        </div>
      ))}
    </div>
  );
}
