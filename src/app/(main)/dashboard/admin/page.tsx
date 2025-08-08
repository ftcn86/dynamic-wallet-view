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
  const [confirmEnableDevice, setConfirmEnableDevice] = useState(false);

  useEffect(() => {
    // Determine if admin-session is already active to show dashboard immediately
    (async () => {
      try {
        const sess = await fetch('/api/admin/session', { credentials: 'include' });
        if (sess.ok) {
          const j = await sess.json();
          if (j.authed) setAuthed(true);
        }
      } catch {}
    })();
    // Also preload device info for optional device auth enabling
    (async () => {
      try {
        const res = await fetch('/api/admin/device', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        setDeviceInfo({ enforced: data.enforced, allowed: data.allowed, deviceHash: data.deviceHash });
        if (!data.enforced) setShowDevicePrompt(true); // propose enabling
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
              <AlertDialogTitle>Enable device authentication for Admin?</AlertDialogTitle>
              <AlertDialogDescription>
                This adds an extra security layer by allowing admin access only from approved devices. Do you want to enable device authentication for this device?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="rounded-md bg-muted p-3 text-xs break-all">
              <div className="font-mono">{deviceInfo.deviceHash}</div>
              <div className="mt-2 opacity-70">Copy this device hash and add it to the ADMIN_DEVICE_HASHES environment variable to approve this device.</div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Not now</AlertDialogCancel>
              <AlertDialogAction onClick={() => { navigator.clipboard.writeText(deviceInfo.deviceHash); setConfirmEnableDevice(true); setShowDevicePrompt(false); }}>Copy hash</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Follow-up confirmation explaining env update step */}
      {confirmEnableDevice && (
        <AlertDialog open={confirmEnableDevice} onOpenChange={setConfirmEnableDevice}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Device hash copied</AlertDialogTitle>
              <AlertDialogDescription>
                Paste the copied hash into your deployment’s ADMIN_DEVICE_HASHES environment variable and redeploy. After redeploy, this device will be allowed for admin access.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setConfirmEnableDevice(false)}>Done</AlertDialogAction>
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


