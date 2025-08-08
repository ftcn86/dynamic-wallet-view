import { NextRequest, NextResponse } from 'next/server';
import { requireSessionAndPiUser } from '@/lib/server-auth';
import { isUidWhitelisted } from '@/lib/admin';
import { computeDeviceHashFromRequest, isDeviceWhitelisted, isDeviceEnforced } from '@/lib/device';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    await rateLimit(request as unknown as Request, 'admin:device:get', 15, 60_000);
    const { piUser } = await requireSessionAndPiUser(request);
    if (!isUidWhitelisted(piUser.uid)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const hash = computeDeviceHashFromRequest(request);
    const enforced = isDeviceEnforced();
    const allowed = isDeviceWhitelisted(hash);
    return NextResponse.json({ success: true, deviceHash: hash, enforced, allowed });
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}


