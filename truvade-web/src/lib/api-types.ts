/**
 * Types that exactly mirror the Django backend serializers.
 * Field names match the snake_case keys returned by the API.
 */

// ── Accounts ─────────────────────────────────────────────────────────────────

export type ApiRole = "GUEST" | "HOST" | "OWNER" | "ADMIN";

/** UserSerializer — returned inside verify-otp response */
export interface ApiUserBasic {
  id: number;
  email: string;
  name: string;
  phone: string;
  avatar: string | null;
  role: ApiRole;
  date_joined: string;
}

/** OwnProfileSerializer — returned from GET /profile/me/ */
export interface ApiProfile extends ApiUserBasic {
  preferred_name: string;
  bio: string;
  work: string;
  location: string;
  languages: string[];
  emergency_contact: string;
  address: string;
  is_verified: boolean;
}

/** PublicProfileSerializer — returned from GET /profiles/<id>/ */
export interface ApiPublicProfile {
  id: number;
  name: string;
  avatar: string | null;
  role: ApiRole;
  bio: string;
  work: string;
  location: string;
  languages: string[];
  is_verified: boolean;
  date_joined: string;
}

/** VerifyOTP response data */
export interface ApiAuthResult {
  user: ApiUserBasic;
  tokens: {
    access: string;
    refresh: string;
  };
}

/** InvitationSerializer */
export interface ApiInvitation {
  id: number;
  owner: number;
  owner_name: string;
  owner_email: string;
  email: string;
  token: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
  expires_at: string;
  created_at: string;
}

/** MembershipSerializer */
export interface ApiMembership {
  id: number;
  owner: number;
  owner_name: string;
  owner_email: string;
  host: number;
  host_name: string;
  host_email: string;
  is_active: boolean;
  created_at: string;
}

/** VerificationSerializer */
export interface ApiVerification {
  id: number;
  user: number;
  user_email: string;
  verification_type: "NIN";
  id_number: string;
  id_document: string;
  selfie: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  admin_notes: string;
  reviewed_by: number | null;
  reviewed_by_email: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Shortlets ─────────────────────────────────────────────────────────────────

export interface ApiAmenity {
  id: number;
  name: string;
  icon: string;
}

export interface ApiShortletImage {
  id: number;
  image: string;
  is_cover: boolean;
  order: number;
}

export interface ApiHostAssignment {
  id: number;
  host: number;
  host_name: string;
  host_email: string;
  role: "HOST" | "COHOST";
  commission_percentage: string;
  can_edit: boolean;
  can_upload_images: boolean;
  assigned_by: number;
  created_at: string;
}

export type ShortletStatus = "DRAFT" | "PENDING" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type ShortletType = "apartment" | "house" | "studio" | "villa";

export interface ApiShortlet {
  id: number;
  owner: number;
  title: string;
  description: string;
  shortlet_type: ShortletType;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: string | null;
  longitude: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  min_nights: number;
  base_price: string;
  cleaning_fee: string;
  currency: string;
  amenities: ApiAmenity[];
  status: ShortletStatus;
  featured: boolean;
  verified: boolean;
  guest_favorite: boolean;
  images: ApiShortletImage[];
  host_assignments: ApiHostAssignment[];
  created_at: string;
  updated_at: string;
}

export interface ApiAvailableHost {
  id: number;
  name: string;
  email: string;
}

/** Availability date range returned by /shortlets/<id>/availability/ */
export interface ApiAvailability {
  check_in: string;
  check_out: string;
}

// ── Bookings ─────────────────────────────────────────────────────────────────

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface ApiBookingShortletSummary {
  id: number;
  title: string;
  city: string;
  state: string;
  shortlet_type: ShortletType;
  cover_image: string | null;
}

export interface ApiBooking {
  id: number;
  guest: number;
  guest_name: string;
  guest_email: string;
  shortlet: ApiBookingShortletSummary;
  check_in: string;
  check_out: string;
  number_of_guests: number;
  number_of_nights: number;
  base_price_per_night: string;
  cleaning_fee: string;
  subtotal: string;
  platform_fee: string;
  total_price: string;
  currency: string;
  host_commission_percentage: string;
  host_payout_amount: string;
  cohost_commission_percentage: string;
  cohost_payout_amount: string;
  owner_payout_amount: string;
  status: BookingStatus;
  guest_note: string;
  cancelled_at: string | null;
  cancellation_reason: string;
  created_at: string;
  updated_at: string;
}

export interface ApiPaymentSummary {
  reference: string;
  authorization_url: string;
  status: string;
}

export interface ApiBookingWithPayment extends ApiBooking {
  payment: ApiPaymentSummary;
}

// ── Payments ──────────────────────────────────────────────────────────────────

export interface ApiPayment {
  id: number;
  booking: number;
  reference: string;
  amount: string;
  currency: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  paystack_authorization_url: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface ApiBankAccount {
  id: number;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ApiPayout {
  id: number;
  recipient_type: "OWNER" | "HOST" | "COHOST";
  amount: string;
  transfer_reference: string | null;
  status: "PENDING" | "SUCCESS" | "FAILED";
  bank_account: ApiBankAccount | null;
  completed_at: string | null;
  created_at: string;
}

export interface ApiBank {
  name: string;
  code: string;
}
