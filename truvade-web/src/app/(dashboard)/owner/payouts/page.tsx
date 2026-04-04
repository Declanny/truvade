"use client";

import { WalletView } from "@/components/wallet/WalletView";
import { ownerWalletBalance, ownerTransactions } from "@/lib/mock-wallet";

export default function OwnerWalletPage() {
  return <WalletView balance={ownerWalletBalance} transactions={ownerTransactions} />;
}
