import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { amount, memo, metadata, uid } = await request.json();

    // Validate required fields
    if (!amount || !memo || !uid) {
      return NextResponse.json(
        { error: 'Amount, memo, and user ID are required' },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    console.log('🔍 Creating App-to-User payment...');
    console.log(`🔧 Amount: ${amount} Pi`);
    console.log(`🔧 Memo: ${memo}`);
    console.log(`🔧 User ID: ${uid}`);
    console.log(`🔧 Environment: ${config.isDevelopment ? 'development' : 'production'}`);

    const piPlatformClient = getPiPlatformAPIClient();

    try {
      const paymentData = {
        amount,
        memo,
        metadata: metadata || {},
        uid
      };

      const result = await piPlatformClient.createAppToUserPayment(paymentData);
      console.log('✅ App-to-User payment created successfully');
      console.log('🔧 Payment result:', result);

      return NextResponse.json({
        success: true,
        message: `Payment of ${amount} Pi sent to user ${uid}`,
        payment: result,
        environment: {
          platformApiUrl: config.piNetwork.platformApiUrl,
        }
      });
    } catch (platformError) {
      console.error('❌ Pi Platform A2U payment creation failed:', platformError);
      return NextResponse.json(
        { 
          error: 'Failed to create App-to-User payment',
          details: platformError instanceof Error ? platformError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ A2U payment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 