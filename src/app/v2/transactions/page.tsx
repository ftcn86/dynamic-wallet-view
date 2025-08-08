"use client";

import { useEffect, useMemo, useState } from 'react';
import type { Transaction } from '@/data/schemas';

export default function Page() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all'|'sent'|'received'|'mining_reward'|'node_bonus'>('all');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/transactions', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Failed')))
      .then((d) => setTxns(d.transactions || []))
      .catch(() => setError('Failed to load transactions'))
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo(() => txns.filter((t) => filter==='all' ? true : t.type===filter), [txns, filter]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Transactions</h1>
      <div className="flex gap-2">
        {(['all','sent','received','mining_reward','node_bonus'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-sm rounded border ${filter===f ? 'bg-primary text-primary-foreground' : ''}`}>
            {f}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">Loading…</div>
      ) : error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">{error}</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">No transactions.</div>
      ) : (
        <div className="rounded-lg border divide-y">
          {items.map((t) => (
            <div key={t.id} className="p-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-medium truncate">{t.description}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(t.date).toLocaleDateString()} • {t.type}
                </div>
              </div>
              <div className="font-mono ml-4">{(t.type==='sent'?'-':'+')}{t.amount.toFixed(4)} π</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


