import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import { config } from '@/lib/config';

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

    // 2. Approve the payment with Pi Network IMMEDIATELY
    try {
      console.log(`[${now()}] 🔗 Calling piPlatformClient.approvePayment...`);
      await piPlatformClient.approvePayment(paymentId);
      console.log(`[${now()}] ✅ Payment approved successfully`);

      // 3. Fetch payment details (optional, for DB)
      console.log(`[${now()}] 🔗 Fetching payment details from Pi Platform API...`);
      const currentPayment = await piPlatformClient.getPayment(paymentId);
      console.log(`[${now()}] 📋 Payment details:`, currentPayment);

      // 4. Store transaction in database (simplified)
      console.log(`[${now()}] 💾 Writing transaction to DB...`);
      try {
        const { TransactionService } = await import('@/services/databaseService');
        
        const orderRecord = await TransactionService.createTransaction(userData.uid, {
          type: 'sent',
          amount: (currentPayment as { amount: number }).amount,
          status: 'pending', // Use 'pending' for approval step
          from: userData.uid,
          to: metadata?.to || 'Dynamic Wallet View',
          description: (currentPayment as { memo?: string }).memo || 'Pi Payment',
          blockExplorerUrl: undefined,
        });
        
        console.log(`[${now()}] 💾 Transaction written to DB.`);
      } catch (dbError) {
        console.warn(`[${now()}] ⚠️ Failed to write transaction to DB:`, dbError);
        // Continue with payment approval even if DB write fails
      }

      // 5. Add notification for successful approval (optional)
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
        payment: currentPayment
      });

    } catch (approvalError) {
      console.error(`[${now()}] ❌ Payment approval failed:`, approvalError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment approval failed',
          message: approvalError instanceof Error ? approvalError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error(`[${now()}] ❌ Payment approval endpoint error:`, error);
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