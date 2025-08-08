"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

type Payment = { id: string; paymentId: string; userId: string; amount: number; memo: string; paid: boolean; cancelled: boolean; txid?: string | null; createdAt: string };

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/payments?status=incomplete', { credentials: 'include' });
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        setItems(data.items || []);
      } catch {
        setError('Failed to load payments');
      }
    })();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin • Payments</h1>
        <Button variant="outline" size="sm" onClick={() => router.replace('/dashboard/admin')}>Return to Admin</Button>
      </div>
      {error && <div className="text-sm text-red-500">{error}</div>}
      {items.length === 0 ? (
        <Card>
          <CardHeader><CardTitle>No incomplete payments</CardTitle></CardHeader>
          <CardContent>All caught up!</CardContent>
        </Card>
      ) : (
        items.map((p) => (
          <Card key={p.id}>
            <CardHeader><CardTitle>{p.paymentId} • {new Date(p.createdAt).toLocaleString()}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm">Amount: {p.amount}π</div>
              <div className="text-sm">Memo: {p.memo}</div>
              <div className="text-sm">Status: {p.cancelled ? 'cancelled' : p.paid ? 'complete' : 'incomplete'}</div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}


