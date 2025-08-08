import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { requireSessionAndPiUser } from '@/lib/server-auth';
import { isUidWhitelisted } from '@/lib/admin';
import { computeDeviceHashFromRequest, isDeviceWhitelisted } from '@/lib/device';

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function POST(request: NextRequest) {
  await rateLimit(request as unknown as Request, 'admin:login', 5, 60_000);
  // Must be signed-in
  let uid: string | undefined;
  try { const { piUser } = await requireSessionAndPiUser(request); uid = piUser.uid; } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  if (!isUidWhitelisted(uid)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const deviceHash = computeDeviceHashFromRequest(request);
  if (!isDeviceWhitelisted(deviceHash)) return NextResponse.json({ error: 'Forbidden (device)' }, { status: 403 });

  const { password } = await request.json();
  const expected = process.env.ADMIN_DASHBOARD_PASSWORD || '';
  if (!expected || !safeEqual(String(password || ''), expected)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set('admin-session', '1', { httpOnly: true, secure: true, sameSite: 'none', maxAge: 60 * 60, path: '/' });
  return res;
}


