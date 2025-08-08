import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { NotificationService } from '@/services/databaseService';
import { getUserFromSession } from '@/lib/session';

// GET: list recent donations and summary
export async function GET() {
  try {
    const [recent, total] = await Promise.all([
      prisma.donation.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.donation.aggregate({ _sum: { amount: true } })
    ]);
    return NextResponse.json({ success: true, recent, totalAmount: total._sum.amount || 0 });
  } catch (error) {
    console.error('donations GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 });
  }
}

// POST: record a donation after successful payment
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) return NextResponse.json({ error: 'No session' }, { status: 401 });

    const { amount, memo, txid, donorName, goalId } = await request.json();
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

    const record = await prisma.donation.create({
      data: {
        userId: user.id,
        goalId: goalId || null,
        amount: Number(amount),
        memo: memo || null,
        donorName: donorName || user.username,
        txid: txid || null,
      }
    });

    // Create an in-app notification so the bell updates
    try {
      await NotificationService.createNotification(user.id, {
        type: 'team_update',
        title: 'Donation Recorded',
        description: `Thanks! Your donation of ${Number(amount)} π has been recorded.`,
        link: '/dashboard/donate'
      } as any);
    } catch {}

    return NextResponse.json({ success: true, donation: record });
  } catch (error) {
    console.error('donations POST error:', error);
    // If table is missing, return a friendly message instead of 500
    if ((error as any)?.code === 'P2021') {
      return NextResponse.json({ success: false, tableMissing: true });
    }
    return NextResponse.json({ error: 'Failed to record donation' }, { status: 500 });
  }
}


