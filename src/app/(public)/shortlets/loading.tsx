import { PropertyCardSkeleton } from "@/components/ui";

export default function ShortletsLoading() {
  return (
    <div className="max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-10 py-6">
      <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }, (_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
