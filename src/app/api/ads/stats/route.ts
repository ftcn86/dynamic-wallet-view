import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromSession } from '@/lib/session';

/**
 * Ad Stats API Endpoint
 * 
 * This endpoint provides statistics about ad performance
 * and user engagement with ads.
 */

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayViews, totalViews] = await Promise.all([
      prisma.adView.count({ where: { userId: user.id, createdAt: { gte: todayStart } } }),
      prisma.adView.count({ where: { userId: user.id } })
    ]);

    const lastView = await prisma.adView.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      dailyWatches: todayViews,
      totalWatches: totalViews,
      lastRewardTime: lastView?.createdAt?.toISOString() || null,
      dailyGoal: 5,
    });
  } catch (error) {
    console.error('Ad stats fetch error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch ad statistics',
        data: null
      },
      { status: 500 }
    );
  }
}

/**
 * Update ad statistics
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const { rewarded } = await request.json();
    await prisma.adView.create({
      data: { userId: user.id, rewarded: !!rewarded }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ad stats update error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update ad statistics',
      },
      { status: 500 }
    );
  }
} 