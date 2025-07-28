import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import { config } from '@/lib/config';
import { TransactionService } from '@/services/databaseService';

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

    console.log('🔍 Approving payment:', paymentId);
    const piPlatformClient = getPiPlatformAPIClient();

    // 1. Approve the payment with Pi Network IMMEDIATELY
    try {
      await piPlatformClient.approvePayment(paymentId);
      console.log('✅ Payment approved successfully');

      // 2. Fetch payment details (optional, for DB)
      const currentPayment = await piPlatformClient.request(`/v2/payments/${paymentId}`);
      console.log('📋 Payment details:', currentPayment);

      // 3. Persist order/payment record in DB
      // TODO: Replace with real user ID extraction
      const userId = 'mock_user_id';
      const orderRecord = await TransactionService.createTransaction(userId, {
        type: 'sent',
        amount: currentPayment.amount,
        status: 'pending', // Use 'pending' for approval step
        from: userId,
        to: metadata?.to || 'Dynamic Wallet View',
        description: currentPayment.memo || 'Pi Payment',
        blockExplorerUrl: undefined,
      });

      // 4. Add notification for successful approval (optional)
      try {
        const { addNotification } = await import('@/services/notificationService');
        addNotification(
          'announcement',
          'Payment Approved',
          `Payment of ${currentPayment.amount}π has been approved and is ready for completion.`,
          '/dashboard/transactions'
        );
      } catch (notificationError) {
        console.warn('⚠️ Failed to add notification:', notificationError);
      }

      return NextResponse.json({
        success: true,
        message: `Payment ${paymentId} approved successfully`,
        order: orderRecord,
        payment: {
          id: paymentId,
          amount: currentPayment.amount,
          memo: currentPayment.memo,
          status: 'approved'
        }
      });

    } catch (platformError) {
      console.error('❌ Payment approval failed:', platformError);
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
        console.warn('⚠️ Failed to add error notification:', notificationError);
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
    console.error('❌ Payment approval API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 