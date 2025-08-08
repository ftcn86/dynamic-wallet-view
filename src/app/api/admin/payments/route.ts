import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { requireSessionAndPiUser } from '@/lib/server-auth';
import { isUidWhitelisted } from '@/lib/admin';

function mapStatusWhere(status?: string) {
  if (status === 'complete') return { paid: true };
  if (status === 'incomplete') return { paid: false, cancelled: false };
  if (status === 'cancelled') return { cancelled: true };
  return {};
}

export async function GET(request: NextRequest) {
  try {
    await rateLimit(request as unknown as Request, 'admin:payments:get', 30, 60_000);
    const { piUser } = await requireSessionAndPiUser(request);
    if (!isUidWhitelisted(piUser.uid)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;
    const cursor = url.searchParams.get('cursor') || undefined;
    const take = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);

    const where = mapStatusWhere(status);
    const items = await prisma.paymentOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: { id: true, paymentId: true, userId: true, amount: true, memo: true, paid: true, cancelled: true, txid: true, createdAt: true }
    });
    const hasMore = items.length > take;
    const trimmed = hasMore ? items.slice(0, take) : items;
    return NextResponse.json({ success: true, items: trimmed, nextCursor: hasMore ? trimmed[trimmed.length - 1].id : null });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load payments' }, { status: 500 });
  }
}


