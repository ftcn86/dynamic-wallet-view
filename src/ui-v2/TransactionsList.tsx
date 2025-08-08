"use client";

import { useEffect, useMemo, useState } from 'react';
import type { Transaction } from '@/data/schemas';

export function TransactionsList() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/transactions', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed'))))
      .then((d) => setTxns(d.transactions || []))
      .catch(() => setError('Failed to load transactions'))
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return txns;
    return txns.filter((t) =>
      [t.description, t.from, t.to, t.txid].filter(Boolean).join(' ').toLowerCase().includes(query)
    );
  }, [txns, q]);

  return (
    <div className="v2-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Transactions</h3>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by memo, address or txid"
          className="h-9 w-56 rounded-md border bg-transparent px-3 text-sm"
        />
      </div>
      {loading ? (
        <div className="text-sm opacity-80">Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-sm opacity-80">No transactions found.</div>
      ) : (
        <div className="divide-y">
          {items.map((t) => (
            <div key={t.id} className="py-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-medium truncate">{t.description}</div>
                <div className="text-xs opacity-70 truncate">
                  {new Date(t.date).toLocaleString()} • {t.type}
                </div>
              </div>
              <div className={`font-mono ml-4 ${t.type==='sent' ? 'text-red-400' : 'text-green-400'}`}>
                {t.type==='sent' ? '-' : '+'}{t.amount.toFixed(4)} π
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


