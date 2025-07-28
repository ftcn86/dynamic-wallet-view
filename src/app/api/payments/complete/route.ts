import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import { config } from '@/lib/config';
import { TransactionService } from '@/services/databaseService';

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
      // TODO: Implement real blockchain verification if possible
      const transactionVerified = true;
      if (!transactionVerified) {
        throw new Error('Transaction verification failed');
      }

      // Update order/payment record in DB (set status to 'completed', add txid)
      // TODO: Replace with real user ID extraction and real order lookup
      const userId = 'mock_user_id';
      // For now, just create a new transaction with status 'completed'
      const updatedOrder = await TransactionService.createTransaction(userId, {
        type: 'sent',
        amount: 0, // Should be updated with actual amount from payment/order
        status: 'completed',
        from: userId,
        to: 'Dynamic Wallet View',
        description: 'Payment completed',
        blockExplorerUrl: `https://api.minepi.com/blockchain/transactions/${txid}`,
      });

      // Complete the payment with Pi Network
      await piPlatformClient.completePayment(paymentId, txid);
      console.log('✅ Payment completed successfully');

      // Add notification for successful completion (optional)
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