/**
 * Maps ApiShortlet (snake_case from backend) → Property (camelCase frontend type).
 * Centralised here so every page uses the same mapping.
 */
import type { Property } from "@/lib/types";
import type { ApiShortlet } from "@/lib/api-types";
import { api } from "@/lib/api";

export function mapShortletToProperty(s: ApiShortlet): Property {
  const sortedImages = [...s.images].sort((a, b) => a.order - b.order);
  const imageUrls = sortedImages.map((img) => img.image);

  const primaryHost = s.host_assignments.find((a) => a.role === "HOST");
  const coHosts = s.host_assignments
    .filter((a) => a.role === "COHOST")
    .map((a) => ({ id: String(a.host), name: a.host_name }));

  return {
    id: String(s.id),
    title: s.title ?? "Shortlet",
    description: s.description ?? "",
    address: s.address ?? "",
    city: s.city ?? "",
    state: s.state ?? "",
    country: s.country ?? "Nigeria",
    lat: s.latitude ? parseFloat(s.latitude) : undefined,
    lng: s.longitude ? parseFloat(s.longitude) : undefined,
    images: imageUrls,
    amenities: s.amenities.map((a) => a.name),
    basePrice: parseFloat(s.base_price) || 0,
    currency: s.currency ?? "NGN",
    bedrooms: s.bedrooms ?? 0,
    bathrooms: s.bathrooms ?? 0,
    maxGuests: s.max_guests ?? 1,
    minNights: s.min_nights ?? 1,
    cleaningFee: parseFloat(s.cleaning_fee) || 0,
    status: s.status,
    propertyType: s.shortlet_type,
    featured: s.featured,
    verified: s.verified,
    guestFavorite: s.guest_favorite,
    reviewCount: 0,
    hostName: primaryHost?.host_name,
    hostId: primaryHost ? String(primaryHost.host) : undefined,
    coHosts,
    orgId: String(s.owner),
    createdAt: new Date(s.created_at),
  };
}

// ── Typed fetch helpers ───────────────────────────────────────────────────────

export interface PublicShortletFilters {
  city?: string;
  state?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  type?: string;
  featured?: boolean;
  guest_favorite?: boolean;
  sort?: "newest" | "price_asc" | "price_desc";
}

function buildQuery(filters: PublicShortletFilters): string {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(filters)) {
    if (val !== undefined && val !== null && val !== "") {
      params.set(key, String(val));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchPublicShortlets(
  filters: PublicShortletFilters = {}
): Promise<Property[]> {
  const shortlets = await api.get<ApiShortlet[]>(
    `/v1/properties/${buildQuery(filters)}`
  );
  return shortlets.map(mapShortletToProperty);
}

export async function fetchPublicShortlet(id: string | number): Promise<Property> {
  const shortlet = await api.get<ApiShortlet>(`/v1/properties/${id}/`);
  return mapShortletToProperty(shortlet);
}
