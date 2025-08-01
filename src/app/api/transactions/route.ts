import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';

export async function GET(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    
    // Validate token with Pi Network
    const piPlatformClient = getPiPlatformAPIClient();
    
    try {
      await piPlatformClient.request('/v2/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    // Get user from database
    const { UserService } = await import('@/services/databaseService');
    const user = await UserService.getUserByAccessToken(accessToken);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = (user as any).id;

    // Mock transaction data for now
    const transactions = [
      {
        id: 'tx_001',
        type: 'received',
        amount: 10.5,
        status: 'completed',
        from: 'pi_network',
        to: 'user_wallet',
        description: 'Mining reward',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        blockExplorerUrl: 'https://explorer.minepi.com/tx/abc123',
      },
      {
        id: 'tx_002',
        type: 'sent',
        amount: 5.0,
        status: 'completed',
        from: 'user_wallet',
        to: 'merchant_wallet',
        description: 'Payment for services',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        blockExplorerUrl: 'https://explorer.minepi.com/tx/def456',
      },
    ];

    return NextResponse.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    
    // Validate token with Pi Network
    const piPlatformClient = getPiPlatformAPIClient();
    
    try {
      await piPlatformClient.request('/v2/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    // Get user from database
    const { UserService } = await import('@/services/databaseService');
    const user = await UserService.getUserByAccessToken(accessToken);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { transactionData } = await request.json();

    // Create transaction in database
    const { TransactionService } = await import('@/services/databaseService');
    const transaction = await TransactionService.createTransaction((user as any).id, transactionData);

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error('Transaction creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
} 