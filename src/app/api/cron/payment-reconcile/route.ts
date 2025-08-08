import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getPiPlatformAPIClient } from '@/lib/pi-network';

// Simple endpoint to reconcile incomplete payments. Recommended to call hourly via external scheduler.
export async function POST(_request: NextRequest) {
  try {
    const pi = getPiPlatformAPIClient();
    const list = await pi.getIncompleteServerPayments();
    let reconciled = 0;
    for (const p of list) {
      try {
        const exists = await prisma.paymentOrder.findUnique({ where: { paymentId: p.identifier } });
        if (!exists) {
          await prisma.paymentOrder.create({
            data: {
              paymentId: p.identifier,
              userId: (await prisma.user.findFirst({ where: { uid: p.user_uid } }))?.id || (await prisma.user.findFirst())!.id,
              amount: p.amount,
              memo: p.memo || 'Pi Payment',
              metadata: p.metadata as any,
              paid: false,
              cancelled: false,
            }
          });
        }
        reconciled++;
      } catch {}
    }
    return NextResponse.json({ success: true, reconciled, total: list.length });
  } catch (error) {
    console.error('payment-reconcile error:', error);
    return NextResponse.json({ error: 'Failed to reconcile' }, { status: 500 });
  }
}


