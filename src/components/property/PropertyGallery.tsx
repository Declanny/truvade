"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface PropertyGalleryProps {
  images: string[];
  alt: string;
}

export const PropertyGallery: React.FC<PropertyGalleryProps> = ({ images, alt }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const placeholder = (
    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-400 text-4xl font-semibold">
      TruVade
    </div>
  );

  if (images.length === 0) {
    return <div className="w-full rounded-xl overflow-hidden"><div className="aspect-[16/9]">{placeholder}</div></div>;
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-2 rounded-xl overflow-hidden h-[300px] md:h-[400px]">
        <div className="col-span-4 md:col-span-2 md:row-span-2 cursor-pointer overflow-hidden group" onClick={() => { setSelectedIndex(0); setIsLightboxOpen(true); }}>
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 group-hover:scale-105 transition-transform duration-300"
            style={{ backgroundImage: images[0] ? `url(${images[0]})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
            {!images[0] && placeholder}
          </div>
        </div>
        {images.slice(1, 5).map((image, index) => (
          <div key={index} className="hidden md:block col-span-1 cursor-pointer overflow-hidden group relative" onClick={() => { setSelectedIndex(index + 1); setIsLightboxOpen(true); }}>
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 group-hover:scale-105 transition-transform duration-300"
              style={{ backgroundImage: image ? `url(${image})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
              {!image && placeholder}
            </div>
            {index === 3 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold backdrop-blur-sm">+{images.length - 5} more</div>
            )}
          </div>
        ))}
      </div>

      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button onClick={() => setIsLightboxOpen(false)} className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10">
            <X className="w-6 h-6" />
          </button>
          {images.length > 1 && (
            <button onClick={() => setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))} className="absolute left-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <div className="max-w-6xl max-h-full w-full h-full bg-center bg-contain bg-no-repeat"
              style={{ backgroundImage: images[selectedIndex] ? `url(${images[selectedIndex]})` : undefined }}>
              {!images[selectedIndex] && placeholder}
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
              {selectedIndex + 1} / {images.length}
            </div>
          </div>
          {images.length > 1 && (
            <button onClick={() => setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))} className="absolute right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10">
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </>
  );
};
