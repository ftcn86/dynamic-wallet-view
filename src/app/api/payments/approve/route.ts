import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import prisma from '@/lib/db';
import { NotificationService } from '@/services/databaseService';
import { requireSessionAndPiUser } from '@/lib/server-auth';

// Use Prisma singleton

/**
 * Payment Approval Endpoint (Following Official Pi Network Documentation EXACTLY)
 */
export async function POST(request: NextRequest) {
  try {
    const { rateLimit } = await import('@/lib/rate-limit');
    await rateLimit(request as unknown as Request, 'payments:approve', 20, 60_000);
    const { paymentId, metadata } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [APPROVE] Request received for paymentId:`, paymentId);
    const piPlatformClient = getPiPlatformAPIClient();

    // 1. Unified session + Pi verification
    let currentUserId: string;
    try {
      const { dbUserId } = await requireSessionAndPiUser(request);
      currentUserId = dbUserId;
    } catch {
      return NextResponse.json({ error: 'No valid authentication found' }, { status: 401 });
    }

    // 3. Get payment details from Pi Network (Official Pattern)
    let paymentDetails;
    try {
      paymentDetails = await piPlatformClient.getPayment(paymentId);
      console.log(`✅ [APPROVE] Payment details retrieved:`, paymentDetails);
    } catch (error) {
      console.error(`❌ [APPROVE] Failed to get payment details:`, error);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // 4. Create order record (Official Pattern)
    try {
      await prisma.paymentOrder.create({
        data: {
          paymentId,
          userId: currentUserId,
          amount: paymentDetails.amount,
          memo: paymentDetails.memo,
          metadata: metadata || {},
          paid: false,
          cancelled: false
        }
      });
      console.log(`✅ [APPROVE] Order record created for payment:`, paymentId);
    } catch (error) {
      console.error(`❌ [APPROVE] Failed to create order record:`, error);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // 5. Approve the payment with Pi Network (Official Pattern)
    try {
      console.log(`🔗 [APPROVE] Calling piPlatformClient.approvePayment...`);
      await piPlatformClient.approvePayment(paymentId);
      console.log(`✅ [APPROVE] Payment approved successfully`);

      // 6. Notify and return success
      try {
        await NotificationService.createNotification(currentUserId, {
          type: 'TEAM_UPDATE' as any,
          title: 'Payment Approved',
          description: `Your payment ${paymentId} was approved.`,
          link: '/dashboard/transactions'
        });
      } catch {}
      return NextResponse.json({ message: `Approved the payment ${paymentId}` });

    } catch (approvalError) {
      console.error(`❌ [APPROVE] Payment approval failed:`, approvalError);
      
      // Clean up order record if approval failed
      try {
        await prisma.paymentOrder.delete({
          where: { paymentId }
        });
        console.log(`🧹 [APPROVE] Cleaned up order record after failed approval`);
      } catch (cleanupError) {
        console.error(`❌ [APPROVE] Failed to clean up order record:`, cleanupError);
      }

      return NextResponse.json(
        { 
          error: 'Payment approval failed',
          message: approvalError instanceof Error ? approvalError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error(`❌ [APPROVE] Payment approval endpoint error:`, error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 