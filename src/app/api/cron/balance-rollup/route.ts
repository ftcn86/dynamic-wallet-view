import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Aggregates daily balance history per user from transactions (very naive example)
export async function POST(_request: NextRequest) {
  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    const since = new Date();
    since.setDate(since.getDate() - 1);
    for (const u of users) {
      const txs = await prisma.transaction.findMany({ where: { userId: u.id, date: { gte: since } } });
      const transferable = txs.reduce((sum, t) => sum + (t.type === 'RECEIVED' ? Number(t.amount) : 0), 0);
      const unverified = 0;
      await prisma.balanceHistory.create({ data: { userId: u.id, date: new Date(), transferable, unverified } });
    }
    return NextResponse.json({ success: true, users: users.length });
  } catch (error) {
    console.error('balance-rollup error:', error);
    return NextResponse.json({ error: 'Failed to roll up balances' }, { status: 500 });
  }
}


