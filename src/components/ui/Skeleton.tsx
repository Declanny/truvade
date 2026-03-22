import React from "react";

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton key={i} className={`h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`} />
    ))}
  </div>
);

export const PropertyCardSkeleton: React.FC = () => (
  <div className="rounded-xl overflow-hidden">
    <Skeleton className="aspect-[4/3] rounded-xl" />
    <div className="pt-3 space-y-2">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-10" />
      </div>
      <Skeleton className="h-3.5 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  </div>
);

export const PropertyDetailSkeleton: React.FC = () => (
  <div>
    {/* Gallery */}
    <Skeleton className="w-full h-[300px] md:h-[400px] rounded-xl" />

    <div className="mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
      {/* Left */}
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-3/4 mb-3" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <div className="flex gap-4 mt-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <SkeletonText lines={4} />
        <Skeleton className="h-px w-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>

      {/* Right - Booking card */}
      <div>
        <div className="border border-gray-200 rounded-xl p-6 space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="border border-gray-200 rounded-xl overflow-hidden">
    <div className="px-6 py-4">
      <Skeleton className="h-6 w-40" />
    </div>
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="px-6 py-3.5 flex items-center gap-6">
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className={`h-4 ${c === 0 ? "w-32" : c === cols - 1 ? "w-16" : "w-24"}`} />
          ))}
        </div>
      ))}
    </div>
  </div>
);
