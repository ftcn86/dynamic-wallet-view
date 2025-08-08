import { NextRequest, NextResponse } from 'next/server';
import { requireSessionAndPiUser } from '@/lib/server-auth';
import { isUidWhitelisted } from '@/lib/admin';
import { computeDeviceHashFromRequest, isDeviceWhitelisted } from '@/lib/device';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    await rateLimit(request as unknown as Request, 'admin:session', 30, 60_000);
    const adminCookie = request.cookies.get('admin-session')?.value;
    if (!adminCookie) return NextResponse.json({ authed: false });
    const { piUser } = await requireSessionAndPiUser(request);
    if (!isUidWhitelisted(piUser.uid)) return NextResponse.json({ authed: false });
    const deviceHash = computeDeviceHashFromRequest(request);
    const deviceOk = isDeviceWhitelisted(deviceHash);
    if (!deviceOk) return NextResponse.json({ authed: false });
    return NextResponse.json({ authed: true });
  } catch {
    return NextResponse.json({ authed: false });
  }
}


