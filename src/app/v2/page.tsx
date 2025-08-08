"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Page() {
  const [balance, setBalance] = useState<number | null>(null);
  useEffect(() => {
    // simple call to existing endpoint; tolerant to 401
    fetch('/api/transactions', { credentials: 'include' })
      .then(() => setBalance(null))
      .catch(() => setBalance(null));
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total Pi Balance</div>
          <div className="mt-1 text-xl font-semibold">{balance !== null ? balance.toFixed(4) : '—'} π</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Mining Rate</div>
          <div className="mt-1 text-xl font-semibold">— π/hr</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Active Team</div>
          <div className="mt-1 text-xl font-semibold">—</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Ads</div>
          <div className="mt-1 text-xl font-semibold">Status: —</div>
        </div>
      </div>
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent</h2>
          <Link href="/v2/transactions" className="text-sm text-primary">View all</Link>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">Transactions preview will appear here.</div>
      </div>
    </div>
  );
}


