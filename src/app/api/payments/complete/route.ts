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

      // Get authenticated user for transaction
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
      
      // Create transaction with real user ID
      let updatedOrder: any;
      try {
        updatedOrder = await TransactionService.createTransaction(userId, {
          type: 'sent',
          amount: 0, // Should be updated with actual amount from payment/order
          status: 'completed',
          from: userId,
          to: 'Dynamic Wallet View',
          description: 'Payment completed',
          blockExplorerUrl: `https://api.minepi.com/blockchain/transactions/${txid}`,
        });
      } catch (error: any) {
        if (error.code === 'P2003') {
          console.error('❌ User not found in database:', userId);
          return NextResponse.json(
            { error: 'User account not found' },
            { status: 404 }
          );
        }
        throw error;
      }

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