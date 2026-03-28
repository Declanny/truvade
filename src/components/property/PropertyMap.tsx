"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { MapPin } from "lucide-react";

interface PropertyMapProps {
  lat?: number;
  lng?: number;
  city: string;
  state: string;
}

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-center text-gray-400">
        <MapPin className="w-8 h-8 mx-auto mb-1 animate-pulse" />
        <p className="text-xs">Loading map...</p>
      </div>
    </div>
  ),
});

export function PropertyMap({ lat, lng, city, state }: PropertyMapProps) {
  if (!lat || !lng) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
        <div className="text-center text-gray-400">
          <MapPin className="w-10 h-10 mx-auto mb-2" />
          <p className="text-sm font-medium">Map view</p>
          <p className="text-xs mt-1">Exact location provided after booking</p>
        </div>
      </div>
    );
  }

  return <LeafletMap lat={lat} lng={lng} city={city} state={state} />;
}
