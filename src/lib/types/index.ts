// Shortlet-specific types for the frontend

export type UserRole = "GUEST" | "OWNER" | "HOST" | "ADMIN";

export type PropertyStatus = "DRAFT" | "PENDING" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "REFUNDED";

export type PaymentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  avatar?: string;
  roles: UserRole[];
  verified: boolean;
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  ownerId: string;
  owner?: User;
  propertyCount?: number;
  createdAt: Date;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  lat?: number;
  lng?: number;
  images: string[];
  amenities: string[];
  basePrice: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  minNights: number;
  cleaningFee: number;
  status: PropertyStatus;
  propertyType: string;
  featured: boolean;
  verified: boolean;
  guestFavorite: boolean;
  rating?: number;
  reviewCount: number;
  hostName?: string;
  hostAvatar?: string;
  orgId: string;
  organization?: Organization;
  createdAt: Date;
}

export interface Booking {
  id: string;
  propertyId: string;
  property?: Property;
  guestId: string;
  guest?: User;
  hostId?: string;
  host?: User;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  platformFee: number;
  hostCommission: number;
  ownerEarnings: number;
  status: BookingStatus;
  specialRequests?: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  paymentRef?: string;
  status: PaymentStatus;
  provider: string;
  paidAt?: Date;
  createdAt: Date;
}

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  sender?: User;
  content: string;
  read: boolean;
  createdAt: Date;
}

export interface Review {
  id: string;
  bookingId: string;
  guestId: string;
  guest?: User;
  propertyId: string;
  property?: Property;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface HostInvitation {
  id: string;
  orgId: string;
  organization?: Organization;
  email: string;
  status: InvitationStatus;
  permissions: string[];
  createdAt: Date;
  expiresAt: Date;
}

export interface HostMembership {
  id: string;
  userId: string;
  user?: User;
  orgId: string;
  organization?: Organization;
  permissions: string[];
  commission: number;
  createdAt: Date;
}

// Search & Filter types
export interface PropertyFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  guests?: number;
  amenities?: string[];
  checkIn?: string;
  checkOut?: string;
}

export interface SearchParams extends PropertyFilters {
  query?: string;
  sortBy?: "price_asc" | "price_desc" | "rating" | "newest";
  page?: number;
  limit?: number;
}

// Utility
export function formatCurrency(amount: number, currency: string = "NGN"): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}
