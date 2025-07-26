import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import { config } from '@/lib/config';

/**
 * Payment Approval Endpoint (Following Official Demo Pattern)
 * 
 * This endpoint approves payments and creates order records.
 * It follows the exact same pattern as the official Pi Network demo.
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
    console.log('📋 Payment metadata:', metadata);

    const piPlatformClient = getPiPlatformAPIClient();

    try {
      // Get payment details from Pi Network
      const currentPayment = await piPlatformClient.request(`/v2/payments/${paymentId}`);
      console.log('📋 Payment details:', {
        amount: currentPayment.amount,
        memo: currentPayment.memo,
        status: currentPayment.status,
        user_uid: currentPayment.user_uid
      });

      // In a real app, you would:
      // 1. Create an order record in your database
      // 2. Reserve inventory if needed
      // 3. Validate payment amount and metadata
      // 4. Check user permissions

      // Create order record (mock implementation)
      const orderRecord = {
        pi_payment_id: paymentId,
        product_id: metadata?.productId || 'donation',
        user_uid: currentPayment.user_uid,
        amount: currentPayment.amount,
        memo: currentPayment.memo,
        txid: null,
        paid: false,
        cancelled: false,
        created_at: new Date().toISOString(),
        metadata: metadata || {}
      };

      console.log('📝 Created order record:', orderRecord);

      // Approve the payment with Pi Network
      await piPlatformClient.approvePayment(paymentId);
      console.log('✅ Payment approved successfully');

      // Add notification for successful approval
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