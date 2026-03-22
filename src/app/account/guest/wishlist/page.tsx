"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { mockProperties } from "@/lib/mock-data";
import { Button } from "@/components/ui";
import Link from "next/link";

const wishlistProperties = mockProperties.slice(0, 4);

export default function GuestWishlistPage() {
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set(wishlistProperties.map((p) => p.id))
  );

  const handleFavorite = (propertyId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(propertyId)) {
        next.delete(propertyId);
      } else {
        next.add(propertyId);
      }
      return next;
    });
  };

  const visibleProperties = wishlistProperties.filter((p) => favorites.has(p.id));

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Wishlist</h1>

      {visibleProperties.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No saved properties yet</h2>
          <p className="text-gray-500 mb-6">Properties you save will appear here</p>
          <Link href="/properties">
            <Button variant="primary" size="lg">Browse Properties</Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {visibleProperties.map((property, i) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <PropertyCard
                property={property}
                isFavorite={favorites.has(property.id)}
                onFavorite={handleFavorite}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
