import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie (following demo pattern)
    const sessionCookie = request.cookies.get('pi-session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch (error) {
      console.error('❌ Invalid session cookie:', error);
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    if (!sessionData.userId) {
      return NextResponse.json(
        { error: 'Invalid session data' },
        { status: 401 }
      );
    }

    // Get user from database
    const { UserService } = await import('@/services/databaseService');
    const user = await UserService.getUserById(sessionData.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

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
    // Get session from cookie (following demo pattern)
    const sessionCookie = request.cookies.get('pi-session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch (error) {
      console.error('❌ Invalid session cookie:', error);
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    if (!sessionData.userId) {
      return NextResponse.json(
        { error: 'Invalid session data' },
        { status: 401 }
      );
    }

    // Get user from database
    const { UserService } = await import('@/services/databaseService');
    const user = await UserService.getUserById(sessionData.userId);
    
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