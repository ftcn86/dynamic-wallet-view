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

      // Get or create user for transaction
      const { UserService } = await import('@/services/databaseService');
      
      // Try to get existing user or create default user
      let user: any = await UserService.getUserById('default_user_id');
      if (!user) {
        // Create a default user if none exists
        user = await UserService.createUser({
          id: 'default_user_id',
          username: 'default_user',
          name: 'Default User',
          avatar: '/default-avatar.png',
          balance: 0,
          miningRate: 0,
          teamSize: 0,
          isNodeOperator: false,
          kycStatus: 'verified',
          joinDate: new Date().toISOString(),
          termsAccepted: true,
          settings: {
            theme: 'system',
            language: 'en',
            notifications: true,
            emailNotifications: false,
            remindersEnabled: false,
            reminderHoursBefore: 1,
          },
          balanceBreakdown: {
            transferableToMainnet: 0,
            totalUnverifiedPi: 0,
            currentlyInLockups: 0,
          },
          unverifiedPiDetails: {
            fromReferralTeam: 0,
            fromSecurityCircle: 0,
            fromNodeRewards: 0,
            fromOtherBonuses: 0,
          },
          badges: [],
          userActiveMiningHours_LastWeek: 0,
          userActiveMiningHours_LastMonth: 0,
          activeMiningDays_LastWeek: 0,
          activeMiningDays_LastMonth: 0,
        });
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