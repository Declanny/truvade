"use client";

import { WalletView } from "@/components/wallet/WalletView";
import { hostWalletBalance, hostTransactions } from "@/lib/mock-wallet";

export default function HostWalletPage() {
  return <WalletView balance={hostWalletBalance} transactions={hostTransactions} />;
}
