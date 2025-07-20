import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { action, paymentId, txid } = await request.json();

    console.log(`🔍 Payment API call: ${action}`);
    console.log(`🔧 Environment: ${config.isDevelopment ? 'development' : 'production'}`);
    console.log(`🔧 Platform API URL: ${config.piNetwork.platformApiUrl}`);

    const piPlatformClient = getPiPlatformAPIClient();

    switch (action) {
      case 'approve':
        if (!paymentId) {
          return NextResponse.json(
            { error: 'Payment ID is required for approval' },
            { status: 400 }
          );
        }

        try {
          console.log(`🔍 Approving payment: ${paymentId}`);
          const result = await piPlatformClient.approvePayment(paymentId);
          console.log('✅ Payment approval successful');
          
          return NextResponse.json({
            success: true,
            message: `Payment ${paymentId} approved successfully`,
            result,
            environment: {
              platformApiUrl: config.piNetwork.platformApiUrl,
            }
          });
        } catch (error) {
          console.error('❌ Payment approval failed:', error);
          return NextResponse.json(
            { error: 'Payment approval failed' },
            { status: 500 }
          );
        }

      case 'complete':
        if (!paymentId || !txid) {
          return NextResponse.json(
            { error: 'Payment ID and transaction ID are required for completion' },
            { status: 400 }
          );
        }

        try {
          console.log(`🔍 Completing payment: ${paymentId} with txid: ${txid}`);
          console.log(`🔧 API Key present: ${!!config.piNetwork.apiKey}`);
          console.log(`🔧 Platform API URL: ${config.piNetwork.platformApiUrl}`);
          
          const result = await piPlatformClient.completePayment(paymentId, txid);
          console.log('✅ Payment completion successful');
          
          return NextResponse.json({
            success: true,
            message: `Payment ${paymentId} completed successfully`,
            result,
            environment: {
              platformApiUrl: config.piNetwork.platformApiUrl,
            }
          });
        } catch (error) {
          console.error('❌ Payment completion failed:', error);
          console.error('❌ Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            paymentId,
            txid,
            apiKeyPresent: !!config.piNetwork.apiKey,
            platformApiUrl: config.piNetwork.platformApiUrl
          });
          
          // Return more detailed error for debugging
          return NextResponse.json(
            { 
              error: 'Payment completion failed',
              details: error instanceof Error ? error.message : 'Unknown error',
              paymentId,
              txid
            },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: approve or complete' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Payments API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 