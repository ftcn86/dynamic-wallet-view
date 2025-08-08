"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Item = { id: string; type: string; message: string; status: string; createdAt: string };

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/feedback', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setItems(data.items || []);
      } catch {
        setError('Failed to load feedback');
      }
    })();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Admin • Feedback</h1>
      {error && <div className="text-sm text-red-500">{error}</div>}
      {items.length === 0 ? (
        <Card>
          <CardHeader><CardTitle>No feedback yet</CardTitle></CardHeader>
          <CardContent>Submitted feedback will appear here.</CardContent>
        </Card>
      ) : (
        items.map((i) => (
          <Card key={i.id}>
            <CardHeader><CardTitle>{i.type} • {new Date(i.createdAt).toLocaleString()}</CardTitle></CardHeader>
            <CardContent>{i.message}</CardContent>
          </Card>
        ))
      )}
    </div>
  );
}


