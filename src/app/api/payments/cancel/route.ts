import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import { config } from '@/lib/config';
import { getUserFromSession } from '@/lib/session';
import { NotificationService } from '@/services/databaseService';

/**
 * Payment Cancellation Endpoint (Following Official Demo Pattern)
 * 
 * This endpoint cancels payments and updates order records.
 * It follows the exact same pattern as the official Pi Network demo.
 */

export async function POST(request: NextRequest) {
  try {
    const { paymentId, reason } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Cancelling payment:', paymentId);
    console.log('📋 Cancellation reason:', reason || 'User cancelled');

    const piPlatformClient = getPiPlatformAPIClient();

    try {
      // In a real app, you would:
      // 1. Update the order record in your database
      // 2. Release any reserved inventory
      // 3. Send cancellation notifications
      // 4. Log the cancellation for analytics

      // Update order record (mock implementation)
      const updatedOrder = {
        pi_payment_id: paymentId,
        cancelled: true,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || 'User cancelled'
      };

      console.log('📝 Updated order record:', updatedOrder);

      // Cancel the payment with Pi Network
      await piPlatformClient.cancelPayment(paymentId);
      console.log('✅ Payment cancelled successfully');

      // Add cancellation notification (DB-backed)
      try {
        const user = await getUserFromSession(request);
        if (user) {
          await NotificationService.createNotification(user.id, {
            type: 'announcement' as any,
            title: 'Payment Cancelled',
            description: `Payment ${paymentId} has been cancelled. ${reason ? `Reason: ${reason}` : ''}`,
            link: '/dashboard/transactions'
          });
        }
      } catch (notificationError) {
        console.warn('⚠️ Failed to add notification:', notificationError);
      }

      return NextResponse.json({
        success: true,
        message: `Payment ${paymentId} cancelled successfully`,
        order: updatedOrder,
        cancellation: {
          paymentId,
          reason: reason || 'User cancelled',
          timestamp: new Date().toISOString()
        }
      });

    } catch (platformError) {
      console.error('❌ Payment cancellation failed:', platformError);
      
      // Add error notification (DB-backed)
      try {
        const user = await getUserFromSession(request);
        if (user) {
          await NotificationService.createNotification(user.id, {
            type: 'announcement' as any,
            title: 'Payment Cancellation Failed',
            description: `Failed to cancel payment ${paymentId}. Please contact support.`,
            link: '/dashboard/transactions'
          });
        }
      } catch (notificationError) {
        console.warn('⚠️ Failed to add error notification:', notificationError);
      }

      return NextResponse.json(
        { 
          error: 'Payment cancellation failed',
          details: platformError instanceof Error ? platformError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Payment cancellation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 