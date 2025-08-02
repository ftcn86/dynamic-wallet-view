import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';

function now() {
  return new Date().toISOString();
}

/**
 * Payment Completion Endpoint (Following Official Demo Pattern)
 */
export async function POST(request: NextRequest) {
  try {
    const { paymentId, txid } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    if (!txid) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    console.log(`[${now()}] 🔍 [COMPLETE] Request received for paymentId:`, paymentId, 'txid:', txid);
    const piPlatformClient = getPiPlatformAPIClient();

    // 1. Get authenticated user from access token (Official Demo Pattern)
    const accessToken = request.cookies.get('pi-access-token')?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }

    // Verify user with Pi Platform API
    let userData;
    try {
      userData = await piPlatformClient.verifyUser(accessToken);
      console.log(`[${now()}] ✅ User verified:`, userData.uid);
    } catch (error) {
      console.error(`[${now()}] ❌ User verification failed:`, error);
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    // 2. Complete the payment with Pi Network
    try {
      console.log(`[${now()}] 🔗 Calling piPlatformClient.completePayment...`);
      const completedPayment = await piPlatformClient.completePayment(paymentId, txid);
      console.log(`[${now()}] ✅ Payment completed successfully`);

      // 3. Update transaction in database (simplified)
      console.log(`[${now()}] 💾 Payment completed, skipping DB update for now...`);
      // Note: In a full implementation, you would update the transaction status here
      // For now, we focus on the core payment completion functionality

      // 4. Add notification for successful completion
      try {
        const { addNotification } = await import('@/services/notificationService');
        addNotification(
          'announcement',
          'Payment Completed',
          `Payment of ${(completedPayment as { amount: number }).amount}π has been completed successfully.`,
          '/dashboard/transactions'
        );
      } catch (notificationError) {
        console.warn(`[${now()}] ⚠️ Failed to add notification:`, notificationError);
      }

      console.log(`[${now()}] 🚀 Responding to frontend with success.`);
      return NextResponse.json({
        success: true,
        message: `Payment ${paymentId} completed successfully`,
        payment: completedPayment
      });

    } catch (completionError) {
      console.error(`[${now()}] ❌ Payment completion failed:`, completionError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment completion failed',
          message: completionError instanceof Error ? completionError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error(`[${now()}] ❌ Payment completion endpoint error:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 