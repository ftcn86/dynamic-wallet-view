"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MetricStrip } from '@/ui-v2/MetricStrip';
import { TransactionsList } from '@/ui-v2/TransactionsList';

export default function Page() {
  const [balance, setBalance] = useState<number | null>(null);
  useEffect(() => {
    // simple call to existing endpoint; tolerant to 401
    fetch('/api/transactions', { credentials: 'include' })
      .then(() => setBalance(null))
      .catch(() => setBalance(null));
  }, []);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-extrabold v2-title tracking-tight">Your Pi Hub</h1>
        <span className="v2-pill">Sandbox • V2</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MetricStrip label="Total Pi Balance" value={balance !== null ? balance.toFixed(4) : '—'} unit="π" series={[3,5,6,8,5,7,9,4,3,6,7,10,8]} />
        <MetricStrip label="Mining Rate" value="—" unit="π/hr" series={[1,2,1,3,2,2,1,3,4,2,1,2]} />
        <MetricStrip label="Active Team" value="—" series={[2,3,2,4,5,4,6,5,7,6,6,7]} />
      </div>
      <TransactionsList />
    </div>
  );
}


