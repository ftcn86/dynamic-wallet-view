"use client";

import { useEffect, useState } from 'react';

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/team/members', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Failed')))
      .then((d) => setMembers(d.members || []))
      .catch(() => setError('Failed to load team'))
      .finally(() => setLoading(false));
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Team</h1>
      {loading ? (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">Loading…</div>
      ) : error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">{error}</div>
      ) : (
        <div className="rounded-lg border">
          {members.map((m) => (
            <div key={m.id} className="p-3 border-b last:border-b-0 flex items-center justify-between">
              <div className="font-medium">{m.name}</div>
              <div className="text-sm text-muted-foreground">{m.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


