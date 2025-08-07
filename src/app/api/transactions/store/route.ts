import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, txid, metadata } = await request.json();
    
    // Validate required fields
    if (!paymentId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing paymentId' 
      }, { status: 400 });
    }

    console.log(`💾 [STORE] Storing transaction for paymentId:`, paymentId);
    
    const piPlatformClient = getPiPlatformAPIClient();
    
    // 1. Get authenticated user from session (Official Pattern)
    const sessionToken = request.cookies.get('session-token')?.value;
    if (!sessionToken) {
      console.error(`❌ [STORE] No session token found`);
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // 2. Get user from session and access token from database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    let userData;
    try {
      console.log(`🔍 [STORE] Getting user from session...`);
      const session = await prisma.userSession.findFirst({
        where: { 
          sessionToken,
          isActive: true,
          expiresAt: { gt: new Date() }
        },
        include: { user: true }
      });

      if (!session || !session.user.accessToken) {
        console.error(`❌ [STORE] Invalid session or no access token`);
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid session' 
        }, { status: 401 });
      }

      // 3. Verify user with Pi Platform API using access token from database
      console.log(`🔍 [STORE] Verifying user with Pi Platform API...`);
      userData = await piPlatformClient.verifyUser(session.user.accessToken);
      console.log(`✅ [STORE] User verified:`, userData.uid);
    } catch (verifyError) {
      console.error(`❌ [STORE] User verification failed:`, verifyError);
      return NextResponse.json({ 
        success: false, 
        error: 'User verification failed' 
      }, { status: 401 });
    }

    // 3. Get payment details from Pi Platform API (Official Pattern)
    let paymentDetails;
    try {
      console.log(`🔍 [STORE] Getting payment details from Pi Platform API...`);
      paymentDetails = await piPlatformClient.getPayment(paymentId);
      console.log(`✅ [STORE] Payment details retrieved:`, paymentDetails);
    } catch (paymentError) {
      console.error(`❌ [STORE] Failed to get payment details:`, paymentError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to get payment details' 
      }, { status: 500 });
    }

    // 4. Store transaction in database (Non-blocking for payment flow)
    try {
      console.log(`💾 [STORE] Writing transaction to DB...`);
      
      const { TransactionService } = await import('@/services/databaseService');
      
      const transactionData = {
        type: 'sent' as const,
        amount: (paymentDetails as { amount: number }).amount,
        status: 'completed' as const,
        from: userData.uid,
        to: metadata?.to || 'Dynamic Wallet View',
        description: (paymentDetails as { memo?: string }).memo || 'Pi Payment',
        blockExplorerUrl: txid ? `https://api.minepi.com/blockchain/transactions/${txid}` : undefined,
        txid: txid,
        date: new Date().toISOString(),
      };

      const orderRecord = await TransactionService.createTransaction(userData.uid, transactionData);
      console.log(`✅ [STORE] Transaction stored successfully:`, orderRecord);

      // 5. Add notification for successful transaction storage
      try {
        const { notifyInfo } = await import('@/services/piNotificationService');
        await notifyInfo(
          'Transaction Recorded',
          `Your payment of ${transactionData.amount} Pi has been recorded in your transaction history.`,
          '/dashboard/transactions'
        );
        console.log(`✅ [STORE] Notification added successfully`);
      } catch (notificationError) {
        console.warn(`⚠️ [STORE] Failed to add notification:`, notificationError);
        // Don't fail the whole operation for notification errors
      }

      return NextResponse.json({ 
        success: true, 
        message: `Transaction stored successfully`,
        transaction: orderRecord 
      });

    } catch (dbError) {
      console.error(`❌ [STORE] Failed to store transaction in DB:`, dbError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to store transaction', 
        message: dbError instanceof Error ? dbError.message : 'Database error' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error(`❌ [STORE] Transaction storage endpoint error:`, error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 