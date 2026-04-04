"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export interface StatItem {
  label: string;
  value: string;
  icon: ReactNode;
  change?: string;
}

interface StatBarProps {
  items: StatItem[];
}

export function StatBar({ items }: StatBarProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="flex items-center gap-2.5 px-4 py-2 bg-white border border-gray-200 rounded-lg"
        >
          <div className="text-gray-600">{item.icon}</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm text-gray-700 font-medium">{item.label}</span>
            <span className="text-base font-bold text-gray-900">{item.value}</span>
            {item.change && <span className="text-xs text-gray-500">{item.change}</span>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
