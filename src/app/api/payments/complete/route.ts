import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';

/**
 * Payment Completion Endpoint (Following Official Pi Network Documentation EXACTLY)
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

    console.log(`🔍 [COMPLETE] Request received for paymentId:`, paymentId, 'txid:', txid);
    const piPlatformClient = getPiPlatformAPIClient();

    // 1. Get authenticated user from access token (Official Pattern)
    const accessToken = request.cookies.get('pi-access-token')?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }

    // 2. Verify user with Pi Platform API (Official Pattern)
    let userData;
    try {
      userData = await piPlatformClient.verifyUser(accessToken);
      console.log(`✅ User verified:`, userData.uid);
    } catch (error) {
      console.error(`❌ User verification failed:`, error);
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    // 3. Complete the payment with Pi Network (Official Pattern)
    try {
      console.log(`🔗 Calling piPlatformClient.completePayment...`);
      await piPlatformClient.completePayment(paymentId, txid);
      console.log(`✅ Payment completed successfully`);
      
      // 4. Store transaction (NON-CRITICAL, can fail safely)
      try {
        console.log(`💾 [COMPLETE] Storing transaction after successful payment...`);
        const storeResponse = await fetch(`${request.nextUrl.origin}/api/transactions/store`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            paymentId,
            txid,
            metadata: { to: 'Dynamic Wallet View' }
          })
        });
        
        if (storeResponse.ok) {
          console.log(`✅ [COMPLETE] Transaction stored successfully`);
        } else {
          console.warn(`⚠️ [COMPLETE] Transaction storage failed, but payment is complete`);
        }
      } catch (storageError) {
        console.warn(`⚠️ [COMPLETE] Transaction storage failed, but payment is complete:`, storageError);
      }

      // 5. Return success response (Official Pattern)
      return NextResponse.json({
        success: true,
        message: `Payment ${paymentId} completed successfully`
      });

    } catch (completionError) {
      console.error(`❌ Payment completion failed:`, completionError);
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
    console.error(`❌ Payment completion endpoint error:`, error);
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