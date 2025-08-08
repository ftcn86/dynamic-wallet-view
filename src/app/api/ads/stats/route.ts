import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { requireSessionAndPiUser } from '@/lib/server-auth';

/**
 * Ad Stats API Endpoint
 * 
 * This endpoint provides statistics about ad performance
 * and user engagement with ads.
 */

export async function GET(request: NextRequest) {
  try {
    let userId: string;
    try {
      const { dbUserId } = await requireSessionAndPiUser(request);
      userId = dbUserId;
    } catch {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let todayViews = 0;
    let totalViews = 0;
    let lastView: { createdAt?: Date | null } | null = null;

    try {
      [todayViews, totalViews] = await Promise.all([
        prisma.adView.count({ where: { userId, createdAt: { gte: todayStart } } }),
        prisma.adView.count({ where: { userId } })
      ]);

      lastView = await prisma.adView.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021') {
        // Table missing in the target database. Return safe defaults and a hint flag.
        return NextResponse.json({
          success: true,
          dailyWatches: 0,
          totalWatches: 0,
          lastRewardTime: null,
          dailyGoal: 5,
          tableMissing: true,
        });
      }
      throw err;
    }

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
    let userId: string;
    try {
      const { dbUserId } = await requireSessionAndPiUser(request);
      userId = dbUserId;
    } catch {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const { rewarded } = await request.json();
    try {
      await prisma.adView.create({
        data: { userId, rewarded: !!rewarded }
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021') {
        // Table missing – accept request but indicate tracking is disabled until migrations run
        return NextResponse.json({ success: true, tableMissing: true });
      }
      throw err;
    }

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