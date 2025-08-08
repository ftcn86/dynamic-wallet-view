import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromSession } from '@/lib/session';

// GET: get active goal and progress
export async function GET() {
  try {
    const goal = await prisma.donationGoal.findFirst({ where: { active: true } });
    const total = await prisma.donation.aggregate({ _sum: { amount: true } });
    return NextResponse.json({ success: true, goal, totalAmount: total._sum.amount || 0 });
  } catch (error) {
    console.error('goals GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch donation goal' }, { status: 500 });
  }
}

// POST: upsert active goal (restrict to authenticated session; add admin auth later)
export async function POST(request: NextRequest) {
  try {
    const { rateLimit } = await import('@/lib/rate-limit');
    await rateLimit(request as unknown as Request, 'donations:goals:post', 5, 5 * 60_000);
    const user = await getUserFromSession(request);
    if (!user) return NextResponse.json({ error: 'No session' }, { status: 401 });

    const { targetAmount, title, description } = await request.json();
    if (!targetAmount || targetAmount <= 0) return NextResponse.json({ error: 'Invalid target' }, { status: 400 });

    // Deactivate previous goals and create a new one
    await prisma.donationGoal.updateMany({ where: { active: true }, data: { active: false } });
    const goal = await prisma.donationGoal.create({ data: { targetAmount: Number(targetAmount), title: title || null, description: description || null, active: true } });
    return NextResponse.json({ success: true, goal });
  } catch (error) {
    console.error('goals POST error:', error);
    return NextResponse.json({ error: 'Failed to set donation goal' }, { status: 500 });
  }
}


