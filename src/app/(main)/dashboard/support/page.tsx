"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type FeedbackItem = { id: string; type: string; message: string; status: string; createdAt: string };

export default function SupportInbox() {
  const [items, setItems] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    // Simple client-only view: load recent feedback for user via API (could add endpoint later)
    // Placeholder: show empty state; the admin replies page will come next iteration
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Support Inbox</h1>
      {items.length === 0 ? (
        <Card>
          <CardHeader><CardTitle>No messages yet</CardTitle></CardHeader>
          <CardContent>
            We will notify you here if the team replies to your feedback.
          </CardContent>
        </Card>
      ) : (
        items.map(i => (
          <Card key={i.id}>
            <CardHeader><CardTitle>{i.type} • {new Date(i.createdAt).toLocaleString()}</CardTitle></CardHeader>
            <CardContent>{i.message}</CardContent>
          </Card>
        ))
      )}
    </div>
  );
}


