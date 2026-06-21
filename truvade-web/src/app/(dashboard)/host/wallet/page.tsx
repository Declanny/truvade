"use client";

import { PayoutsView } from "@/components/wallet/PayoutsView";

export default function HostWalletPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your earnings and payout history.
        </p>
      </div>
      <PayoutsView />
    </div>
  );
}
