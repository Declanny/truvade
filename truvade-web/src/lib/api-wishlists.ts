import { api } from "./api";
import type {
  ApiRecentlyViewed,
  ApiShortletCard,
  ApiToggleSaveResult,
  ApiWishlist,
  ApiWishlistItem,
} from "./api-types";
import type { Property } from "./types";

/** Map a slim ApiShortletCard payload onto the rich Property shape used by
 * legacy components (PropertyCard, PropertyListCard). Fields that aren't
 * carried on the card are filled with safe display defaults. */
export function shortletCardToProperty(card: ApiShortletCard): Property {
  const cover = card.cover_image ?? "";
  return {
    id: String(card.id),
    title: card.title,
    description: "",
    address: "",
    city: card.city,
    state: card.state,
    country: card.country,
    images: cover ? [cover] : [],
    amenities: [],
    basePrice: card.base_price ? Number(card.base_price) : 0,
    currency: card.currency,
    bedrooms: card.bedrooms,
    bathrooms: card.bathrooms,
    maxGuests: card.max_guests,
    minNights: 1,
    cleaningFee: Number(card.cleaning_fee),
    status: "ACTIVE",
    propertyType: "apartment",
    featured: false,
    verified: false,
    guestFavorite: card.guest_favorite,
    reviewCount: 0,
    orgId: "",
    createdAt: new Date(),
  };
}

export function listWishlists(): Promise<ApiWishlist[]> {
  return api.get<ApiWishlist[]>("/v1/wishlists/");
}

export function getSavedShortletIds(): Promise<{ shortlet_ids: number[] }> {
  return api.get<{ shortlet_ids: number[] }>("/v1/wishlists/saved-ids/");
}

export function toggleSavedShortlet(
  shortletId: number
): Promise<ApiToggleSaveResult> {
  return api.post<ApiToggleSaveResult>("/v1/wishlists/toggle/", {
    shortlet_id: shortletId,
  });
}

export function createWishlist(
  name: string,
  isPrivate = true
): Promise<ApiWishlist> {
  return api.post<ApiWishlist>("/v1/wishlists/", {
    name,
    is_private: isPrivate,
  });
}

export function renameWishlist(
  wishlistId: number,
  name: string
): Promise<ApiWishlist> {
  return api.patch<ApiWishlist>(`/v1/wishlists/${wishlistId}/`, { name });
}

export function deleteWishlist(wishlistId: number): Promise<void> {
  return api.delete<void>(`/v1/wishlists/${wishlistId}/`);
}

export function addItemToWishlist(
  wishlistId: number,
  shortletId: number,
  note = ""
): Promise<ApiWishlistItem> {
  return api.post<ApiWishlistItem>(`/v1/wishlists/${wishlistId}/items/`, {
    shortlet_id: shortletId,
    note,
  });
}

export function removeItemFromWishlist(
  wishlistId: number,
  shortletId: number
): Promise<void> {
  return api.delete<void>(
    `/v1/wishlists/${wishlistId}/items/${shortletId}/`
  );
}

export function listRecentlyViewed(): Promise<ApiRecentlyViewed[]> {
  return api.get<ApiRecentlyViewed[]>("/v1/recently-viewed/");
}

export function recordShortletView(shortletId: number): Promise<void> {
  return api.post<void>("/v1/recently-viewed/", { shortlet_id: shortletId });
}
