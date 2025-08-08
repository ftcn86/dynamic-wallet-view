import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import prisma from '@/lib/db';

// Use Prisma singleton

/**
 * Handle Incomplete Payment Endpoint (Following Official Pi Network Documentation EXACTLY)
 */
export async function POST(request: NextRequest) {
  try {
    // basic rate limit
    const { rateLimit } = await import('@/lib/rate-limit');
    await rateLimit(request as unknown as Request, 'payments:incomplete', 10, 60_000);
    const { payment } = await request.json();
    const paymentId = payment.identifier;
    const txid = payment.transaction && payment.transaction.txid;
    const txURL = payment.transaction && payment.transaction._link;

    console.log(`🔄 [INCOMPLETE] Handling incomplete payment:`, paymentId);

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // 1. Find the incomplete order (Official Pattern)
    const order = await prisma.paymentOrder.findUnique({
      where: { paymentId }
    });

    // Order doesn't exist 
    if (!order) {
      console.log(`❌ [INCOMPLETE] Order not found for payment:`, paymentId);
      return NextResponse.json(
        { message: "Order not found" },
        { status: 400 }
      );
    }

    // 2. Check the transaction on the Pi blockchain (Official Pattern)
    if (txURL) {
      try {
        const horizonResponse = await fetch(txURL);
        if (horizonResponse.ok) {
          const transactionData = await horizonResponse.json();
          const paymentIdOnBlock = transactionData.memo;

          // Verify payment ID matches
          if (paymentIdOnBlock !== order.paymentId) {
            console.error(`❌ [INCOMPLETE] Payment ID doesn't match. Block: ${paymentIdOnBlock}, Order: ${order.paymentId}`);
            return NextResponse.json(
              { message: "Payment id doesn't match." },
              { status: 400 }
            );
          }

          console.log(`✅ [INCOMPLETE] Transaction verified on blockchain`);
        }
      } catch (error) {
        console.warn(`⚠️ [INCOMPLETE] Failed to verify transaction on blockchain:`, error);
        // Continue with completion even if blockchain verification fails
      }
    }

    // 3. Mark the order as paid (Official Pattern)
    try {
      await prisma.paymentOrder.update({
        where: { paymentId },
        data: { 
          txid: txid || null, 
          paid: true,
          updatedAt: new Date()
        }
      });
      console.log(`✅ [INCOMPLETE] Order marked as paid:`, paymentId);
    } catch (error) {
      console.error(`❌ [INCOMPLETE] Failed to update order:`, error);
      return NextResponse.json(
        { message: "Failed to update order" },
        { status: 500 }
      );
    }

    // 4. Let Pi Servers know that the payment is completed (Official Pattern)
    try {
      const piPlatformClient = getPiPlatformAPIClient();
      await piPlatformClient.completePayment(paymentId, txid || '');
      console.log(`✅ [INCOMPLETE] Payment completed with Pi Network:`, paymentId);
    } catch (error) {
      console.error(`❌ [INCOMPLETE] Failed to complete payment with Pi Network:`, error);
      return NextResponse.json(
        { message: "Failed to complete payment with Pi Network" },
        { status: 500 }
      );
    }

    console.log(`✅ [INCOMPLETE] Successfully handled incomplete payment:`, paymentId);
    return NextResponse.json({ 
      message: `Handled the incomplete payment ${paymentId}` 
    });

  } catch (error) {
    console.error(`❌ [INCOMPLETE] Incomplete payment handling error:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to handle incomplete payment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 