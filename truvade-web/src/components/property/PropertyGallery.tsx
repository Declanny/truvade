"use client";

import React, { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface PropertyGalleryProps {
  images: string[];
  alt: string;
}

export const PropertyGallery: React.FC<PropertyGalleryProps> = ({ images, alt }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const placeholder = (
    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-400 text-4xl font-semibold">
      TruVade
    </div>
  );

  if (images.length === 0) {
    return <div className="w-full rounded-xl overflow-hidden"><div className="aspect-[16/9]">{placeholder}</div></div>;
  }

  const goTo = (index: number) => {
    setSelectedIndex(Math.max(0, Math.min(index, images.length - 1)));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 40) {
      if (touchDeltaX.current < 0) goTo(selectedIndex + 1);
      else goTo(selectedIndex - 1);
    }
    touchDeltaX.current = 0;
  };

  return (
    <>
      {/* Desktop: grid layout */}
      <div className="hidden md:grid grid-cols-4 gap-2 rounded-xl overflow-hidden h-[400px]">
        <div
          className="col-span-2 row-span-2 cursor-pointer overflow-hidden group"
          onClick={() => { setSelectedIndex(0); setIsLightboxOpen(true); }}
        >
          <div
            className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 group-hover:scale-105 transition-transform duration-300"
            style={{ backgroundImage: `url(${images[0]})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        </div>
        {images.slice(1, 5).map((image, index) => (
          <div
            key={index}
            className="col-span-1 cursor-pointer overflow-hidden group relative"
            onClick={() => { setSelectedIndex(index + 1); setIsLightboxOpen(true); }}
          >
            <div
              className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 group-hover:scale-105 transition-transform duration-300"
              style={{ backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }}
            />
            {index === 3 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold backdrop-blur-sm">
                +{images.length - 5} more
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: swipeable carousel */}
      <div
        className="md:hidden relative rounded-xl overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="aspect-[4/3] relative">
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
          >
            {images.map((img, i) => (
              <div
                key={i}
                className="w-full h-full shrink-0 bg-gradient-to-br from-gray-200 to-gray-300"
                style={{ backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center" }}
                onClick={() => setIsLightboxOpen(true)}
              />
            ))}
          </div>

          {/* Counter pill */}
          <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
            {selectedIndex + 1} / {images.length}
          </div>

          {/* Dots */}
          {images.length > 1 && images.length <= 8 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all ${
                    i === selectedIndex ? "w-1.5 h-1.5 bg-white" : "w-1 h-1 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={() => goTo(selectedIndex - 1)}
                className="absolute left-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => goTo(selectedIndex + 1)}
                className="absolute right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="relative w-full h-full flex items-center justify-center p-4">
            <div
              className="max-w-6xl max-h-full w-full h-full bg-center bg-contain bg-no-repeat"
              style={{ backgroundImage: `url(${images[selectedIndex]})` }}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
              {selectedIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
