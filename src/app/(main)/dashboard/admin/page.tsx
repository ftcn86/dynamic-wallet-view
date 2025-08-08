"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [deviceInfo, setDeviceInfo] = useState<{ enforced: boolean; allowed: boolean; deviceHash: string } | null>(null);
  const [showDevicePrompt, setShowDevicePrompt] = useState(false);

  useEffect(() => {
    // Preload device info as soon as page loads so admins see prompt even before password step
    (async () => {
      try {
        const res = await fetch('/api/admin/device', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        setDeviceInfo({ enforced: data.enforced, allowed: data.allowed, deviceHash: data.deviceHash });
        if ((data.enforced && !data.allowed) || !data.enforced) setShowDevicePrompt(true);
      } catch {}
    })();
  }, []);

  const login = async () => {
    setError(null);
    const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ password }) });
    if (res.ok) setAuthed(true); else setError('Invalid password or unauthorized');
  };

  const loadDevice = async () => {
    try {
      const res = await fetch('/api/admin/device', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setDeviceInfo({ enforced: data.enforced, allowed: data.allowed, deviceHash: data.deviceHash });
      // If enforcement is enabled but current device not allowed, show prompt
      if (data.enforced && !data.allowed) setShowDevicePrompt(true);
      // If enforcement not enabled, suggest enabling
      if (!data.enforced) setShowDevicePrompt(true);
    } catch {}
  };

  useEffect(() => {
    if (authed) loadDevice();
  }, [authed]);

  if (!authed) {
    return (
      <div className="p-4 max-w-sm mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input type="password" placeholder="Admin password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={login} disabled={!password}>Enter</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      {deviceInfo && showDevicePrompt && (
        <AlertDialog open={showDevicePrompt} onOpenChange={setShowDevicePrompt}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Secure your admin with device authentication?</AlertDialogTitle>
              <AlertDialogDescription>
                {deviceInfo.enforced
                  ? 'Your deployment enforces device allowlist, but this device is not yet added.'
                  : 'You can optionally enable device allowlisting for admins by setting ADMIN_DEVICE_HASHES.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="rounded-md bg-muted p-3 text-xs break-all">
              <div className="font-mono">{deviceInfo.deviceHash}</div>
              <div className="mt-2 opacity-70">Copy this hash and add it to the ADMIN_DEVICE_HASHES environment variable.</div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  navigator.clipboard.writeText(deviceInfo.deviceHash);
                  setShowDevicePrompt(false);
                }}
              >Copy hash</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Feedback</CardTitle></CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.push('/dashboard/admin/feedback')}>Open</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.push('/dashboard/admin/payments')}>Open</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


