import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireSessionAndPiUser } from '@/lib/server-auth';
import { getPiPlatformAPIClient } from '@/lib/pi-network';

const DAILY_CAP = 5;
const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes
const REWARD_AMOUNT = 0.01;

export async function POST(request: NextRequest) {
  try {
    const { rateLimit } = await import('@/lib/rate-limit');
    await rateLimit(request as unknown as Request, 'ads:view-complete', 30, 60_000);
    let userId: string;
    let uid: string;
    try {
      const { dbUserId, piUser } = await requireSessionAndPiUser(request);
      userId = dbUserId;
      uid = piUser.uid;
    } catch {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Enforce daily cap
    const todayCount = await prisma.adView.count({
      where: { userId, createdAt: { gte: todayStart } }
    });
    if (todayCount >= DAILY_CAP) {
      return NextResponse.json({ success: false, reason: 'daily_cap' });
    }

    // Enforce cooldown
    const lastView = await prisma.adView.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    if (lastView && now.getTime() - lastView.createdAt.getTime() < COOLDOWN_MS) {
      return NextResponse.json({ success: false, reason: 'cooldown' });
    }

    // Record view
    await prisma.adView.create({ data: { userId, rewarded: true } });

    // Optional A2U reward
    try {
      const pi = getPiPlatformAPIClient();
      await pi.createA2UPayment({
        recipient_uid: uid,
        amount: REWARD_AMOUNT,
        memo: 'Ad reward',
        metadata: { type: 'ad_reward' }
      });

      // Log reward to transactions as RECEIVED
      await prisma.transaction.create({
        data: {
          userId,
          date: new Date(),
          type: 'RECEIVED',
          amount: REWARD_AMOUNT,
          status: 'COMPLETED',
          from: 'Ad Reward',
          description: 'Reward for watching an ad'
        }
      });
    } catch (e) {
      // Reward failure should not block the view record
      console.warn('A2U reward failed:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('view-complete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


