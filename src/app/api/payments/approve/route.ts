import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import { config } from '@/lib/config';
import { TransactionService } from '@/services/databaseService';

function now() {
  return new Date().toISOString();
}

/**
 * Payment Approval Endpoint (Official Pi Demo Pattern)
 */
export async function POST(request: NextRequest) {
  try {
    const { paymentId, metadata } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    console.log(`[${now()}] 🔍 [APPROVE] Request received for paymentId:`, paymentId);
    const piPlatformClient = getPiPlatformAPIClient();

    // 1. Approve the payment with Pi Network IMMEDIATELY
    try {
      console.log(`[${now()}] 🔗 Calling piPlatformClient.approvePayment...`);
      await piPlatformClient.approvePayment(paymentId);
      console.log(`[${now()}] ✅ Payment approved successfully`);

      // 2. Fetch payment details (optional, for DB)
      console.log(`[${now()}] 🔗 Fetching payment details from Pi Platform API...`);
      const currentPayment = await piPlatformClient.getPayment(paymentId);
      console.log(`[${now()}] 📋 Payment details:`, currentPayment);

      // 3. Get authenticated user for transaction
      const { UserService } = await import('@/services/databaseService');
      const { getSessionUser } = await import('@/lib/session');
      
      // FIXED: Use real authenticated user instead of default user
      const sessionUser = await getSessionUser(request);
      if (!sessionUser) {
        return NextResponse.json(
          { error: 'No session found' },
          { status: 401 }
        );
      }
      
      let user: any = await UserService.getUserById(sessionUser.id);
      if (!user) {
        return NextResponse.json(
          { error: 'User not found in database' },
          { status: 404 }
        );
      }
      
      const userId = user.id;
      console.log(`[${now()}] 💾 Writing transaction to DB...`);
      let orderRecord: any;
      try {
        orderRecord = await TransactionService.createTransaction(userId, {
          type: 'sent',
          amount: (currentPayment as { amount: number }).amount,
          status: 'pending', // Use 'pending' for approval step
          from: userId,
          to: metadata?.to || 'Dynamic Wallet View',
          description: (currentPayment as { memo?: string }).memo || 'Pi Payment',
          blockExplorerUrl: undefined,
        });
      } catch (error: any) {
        if (error.code === 'P2003') {
          console.error(`[${now()}] ❌ User not found in database:`, userId);
          return NextResponse.json(
            { error: 'User account not found' },
            { status: 404 }
          );
        }
        throw error;
      }
      console.log(`[${now()}] 💾 Transaction written to DB.`);

      // 4. Add notification for successful approval (optional)
      try {
        const { addNotification } = await import('@/services/notificationService');
        addNotification(
          'announcement',
          'Payment Approved',
          `Payment of ${(currentPayment as { amount: number }).amount}π has been approved and is ready for completion.`,
          '/dashboard/transactions'
        );
      } catch (notificationError) {
        console.warn(`[${now()}] ⚠️ Failed to add notification:`, notificationError);
      }

      console.log(`[${now()}] 🚀 Responding to frontend with success.`);
      return NextResponse.json({
        success: true,
        message: `Payment ${paymentId} approved successfully`,
        order: orderRecord,
        payment: {
          id: paymentId,
          amount: (currentPayment as { amount: number }).amount,
          memo: (currentPayment as { memo?: string }).memo,
          status: 'approved'
        }
      });

    } catch (platformError) {
      console.error(`[${now()}] ❌ Payment approval failed:`, platformError);
      // Add error notification
      try {
        const { addNotification } = await import('@/services/notificationService');
        addNotification(
          'announcement',
          'Payment Approval Failed',
          `Failed to approve payment ${paymentId}. Please try again.`,
          '/dashboard/transactions'
        );
      } catch (notificationError) {
        console.warn(`[${now()}] ⚠️ Failed to add error notification:`, notificationError);
      }

      return NextResponse.json(
        { 
          error: 'Payment approval failed',
          details: platformError instanceof Error ? platformError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error(`[${now()}] ❌ Payment approval API error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 