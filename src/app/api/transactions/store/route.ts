import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import { requireSessionAndPiUser } from '@/lib/server-auth';

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

    // Unified session + Pi verification
    let dbUserId: string;
    let userData: { uid: string; username: string };
    try {
      const { dbUserId: id, piUser } = await requireSessionAndPiUser(request);
      dbUserId = id;
      userData = piUser;
      console.log(`✅ [STORE] User verified:`, piUser.uid);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
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
        blockExplorerUrl: txid ? (await import('@/lib/config')).getBlockExplorerTxUrl(txid) : undefined,
        txid: txid,
        date: new Date().toISOString(),
      };

      const orderRecord = await TransactionService.createTransaction(dbUserId, transactionData);
      console.log(`✅ [STORE] Transaction stored successfully:`, orderRecord);

      // 5. Create DB-backed notification so the bell updates correctly
      try {
        const { NotificationService } = await import('@/services/databaseService');
        await NotificationService.createNotification(dbUserId, {
          type: 'announcement' as any,
          title: 'Transaction Recorded',
          description: `Your payment of ${transactionData.amount} Pi has been recorded in your transaction history.`,
          link: '/dashboard/transactions'
        });
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