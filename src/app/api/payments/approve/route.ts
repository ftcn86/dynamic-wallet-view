import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';

/**
 * Payment Approval Endpoint (Following Official Pi Network Documentation EXACTLY)
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

    console.log(`🔍 [APPROVE] Request received for paymentId:`, paymentId);
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

    // 3. Approve the payment with Pi Network (Official Pattern)
    try {
      console.log(`🔗 Calling piPlatformClient.approvePayment...`);
      await piPlatformClient.approvePayment(paymentId);
      console.log(`✅ Payment approved successfully`);

      // 4. Return success response (Official Pattern)
      return NextResponse.json({
        success: true,
        message: `Payment ${paymentId} approved successfully`
      });

    } catch (approvalError) {
      console.error(`❌ Payment approval failed:`, approvalError);
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
    console.error(`❌ Payment approval endpoint error:`, error);
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