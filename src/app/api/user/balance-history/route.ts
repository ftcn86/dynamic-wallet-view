import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) return NextResponse.json({ error: 'No session found' }, { status: 401 });

    const period = (new URL(request.url).searchParams.get('period') as '3M' | '6M' | '12M') || '6M';
    const months = period === '3M' ? 3 : period === '6M' ? 6 : 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const points = await prisma.balanceHistory.findMany({
      where: { userId: user.id, date: { gte: startDate } },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ success: true, points });
  } catch (error) {
    console.error('balance-history error:', error);
    return NextResponse.json({ error: 'Failed to fetch balance history' }, { status: 500 });
  }
}


