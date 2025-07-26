import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import { config } from '@/lib/config';

/**
 * Payment Completion Endpoint (Following Official Demo Pattern)
 * 
 * This endpoint completes payments and updates order records.
 * It follows the exact same pattern as the official Pi Network demo.
 */

export async function POST(request: NextRequest) {
  try {
    const { paymentId, txid } = await request.json();

    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: 'Payment ID and transaction ID are required' },
        { status: 400 }
      );
    }

    console.log('🔍 Completing payment:', paymentId);
    console.log('🔗 Transaction ID:', txid);

    const piPlatformClient = getPiPlatformAPIClient();

    try {
      // In a real app, you would:
      // 1. Verify the transaction on the blockchain
      // 2. Update the order record in your database
      // 3. Deliver the product/service to the user
      // 4. Send confirmation emails/notifications

      // Verify transaction on blockchain (mock implementation)
      console.log('🔍 Verifying transaction on blockchain...');
      const transactionVerified = true; // In real app, verify with blockchain API

      if (!transactionVerified) {
        throw new Error('Transaction verification failed');
      }

      // Update order record (mock implementation)
      const updatedOrder = {
        pi_payment_id: paymentId,
        txid: txid,
        paid: true,
        completed_at: new Date().toISOString(),
        transaction_verified: true
      };

      console.log('📝 Updated order record:', updatedOrder);

      // Complete the payment with Pi Network
      await piPlatformClient.completePayment(paymentId, txid);
      console.log('✅ Payment completed successfully');

      // Add transaction to history
      try {
        const { addTransaction } = await import('@/services/piService');
        addTransaction({
          type: 'sent',
          amount: 0, // Will be updated with actual amount from payment
          status: 'completed',
          description: 'Payment completed',
          blockExplorerUrl: `https://api.minepi.com/blockchain/transactions/${txid}`
        });
      } catch (transactionError) {
        console.warn('⚠️ Failed to add transaction:', transactionError);
      }

      // Add success notification
      try {
        const { addNotification } = await import('@/services/notificationService');
        addNotification(
          'announcement',
          'Payment Completed',
          `Payment has been completed successfully. Transaction ID: ${txid}`,
          '/dashboard/transactions'
        );
      } catch (notificationError) {
        console.warn('⚠️ Failed to add notification:', notificationError);
      }

      return NextResponse.json({
        success: true,
        message: `Payment ${paymentId} completed successfully`,
        order: updatedOrder,
        transaction: {
          id: txid,
          verified: true,
          blockExplorerUrl: `https://api.minepi.com/blockchain/transactions/${txid}`
        }
      });

    } catch (platformError) {
      console.error('❌ Payment completion failed:', platformError);
      
      // Add error notification
      try {
        const { addNotification } = await import('@/services/notificationService');
        addNotification(
          'announcement',
          'Payment Completion Failed',
          `Failed to complete payment ${paymentId}. Please contact support.`,
          '/dashboard/transactions'
        );
      } catch (notificationError) {
        console.warn('⚠️ Failed to add error notification:', notificationError);
      }

      return NextResponse.json(
        { 
          error: 'Payment completion failed',
          details: platformError instanceof Error ? platformError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Payment completion API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 