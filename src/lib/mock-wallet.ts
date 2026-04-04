/**
 * Mock wallet data for owner and host dashboards.
 * Replace with real API calls when backend is ready.
 */

export interface WalletBalance {
  totalEarnings: number;
  pendingBalance: number;
  availableBalance: number;
  currency: string;
  canWithdraw: boolean;
}

export type TransactionType = "credit" | "debit";
export type TransactionStatus = "completed" | "pending" | "processing";

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  property: string;
  reference: string;
  status: TransactionStatus;
  date: string;
}

export const ownerWalletBalance: WalletBalance = {
  totalEarnings: 2450000,
  pendingBalance: 380000,
  availableBalance: 1540000,
  currency: "NGN",
  canWithdraw: true,
};

export const hostWalletBalance: WalletBalance = {
  totalEarnings: 920000,
  pendingBalance: 85000,
  availableBalance: 435000,
  currency: "NGN",
  canWithdraw: true,
};

export const ownerTransactions: WalletTransaction[] = [
  { id: "txn-001", type: "credit", amount: 520000, description: "Booking payment received", property: "Penthouse with Rooftop Pool", reference: "BK-003", status: "completed", date: "2026-03-15" },
  { id: "txn-002", type: "credit", amount: 320000, description: "Booking payment received", property: "Luxury 3-Bedroom Apartment", reference: "BK-001", status: "completed", date: "2026-03-10" },
  { id: "txn-003", type: "debit", amount: 450000, description: "Withdrawal to Stripe", property: "—", reference: "WD-001", status: "completed", date: "2026-03-08" },
  { id: "txn-004", type: "credit", amount: 95000, description: "Booking payment received", property: "Cozy Studio in Lekki", reference: "BK-002", status: "completed", date: "2026-03-05" },
  { id: "txn-005", type: "credit", amount: 180000, description: "Booking payment — awaiting checkout", property: "Family Home in Maitama", reference: "BK-004", status: "pending", date: "2026-03-18" },
  { id: "txn-006", type: "debit", amount: 200000, description: "Withdrawal to Stripe", property: "—", reference: "WD-002", status: "processing", date: "2026-03-20" },
  { id: "txn-007", type: "credit", amount: 120000, description: "Booking payment — awaiting checkout", property: "Serviced Apartment Ikeja", reference: "BK-005", status: "pending", date: "2026-03-22" },
  { id: "txn-008", type: "credit", amount: 450000, description: "Booking payment received", property: "Penthouse with Rooftop Pool", reference: "BK-007", status: "completed", date: "2026-02-28" },
  { id: "txn-009", type: "debit", amount: 300000, description: "Withdrawal to Stripe", property: "—", reference: "WD-003", status: "completed", date: "2026-02-25" },
  { id: "txn-010", type: "credit", amount: 280000, description: "Booking payment received", property: "Luxury 3-Bedroom Apartment", reference: "BK-008", status: "completed", date: "2026-02-20" },
];

export const hostTransactions: WalletTransaction[] = [
  { id: "htxn-001", type: "credit", amount: 78000, description: "Commission — booking completed", property: "Penthouse with Rooftop Pool", reference: "BK-003", status: "completed", date: "2026-03-15" },
  { id: "htxn-002", type: "credit", amount: 48000, description: "Commission — booking completed", property: "Luxury 3-Bedroom Apartment", reference: "BK-001", status: "completed", date: "2026-03-10" },
  { id: "htxn-003", type: "debit", amount: 100000, description: "Withdrawal to Stripe", property: "—", reference: "WD-101", status: "completed", date: "2026-03-08" },
  { id: "htxn-004", type: "credit", amount: 27000, description: "Commission — awaiting checkout", property: "Family Home in Maitama", reference: "BK-004", status: "pending", date: "2026-03-18" },
  { id: "htxn-005", type: "credit", amount: 14250, description: "Commission — booking completed", property: "Cozy Studio in Lekki", reference: "BK-002", status: "completed", date: "2026-03-05" },
  { id: "htxn-006", type: "debit", amount: 50000, description: "Withdrawal to Stripe", property: "—", reference: "WD-102", status: "processing", date: "2026-03-20" },
  { id: "htxn-007", type: "credit", amount: 67500, description: "Commission — booking completed", property: "Penthouse with Rooftop Pool", reference: "BK-007", status: "completed", date: "2026-02-28" },
  { id: "htxn-008", type: "credit", amount: 42000, description: "Commission — booking completed", property: "Luxury 3-Bedroom Apartment", reference: "BK-008", status: "completed", date: "2026-02-20" },
];
