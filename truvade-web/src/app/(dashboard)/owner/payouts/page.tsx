"use client";

import { PayoutsView } from "@/components/wallet/PayoutsView";

export default function OwnerPayoutsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your earnings and payout history across all properties.
        </p>
      </div>
      <PayoutsView />
    </div>
  );
}
