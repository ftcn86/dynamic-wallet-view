import { getUserFromSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // DB-first, fallback to small mock set
    const dbTransactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 200
    });
    // Normalize DB enums (UPPERCASE) to app schema (lowercase) and ensure shape
    const normalizedDb = dbTransactions.map((tx) => ({
      id: tx.id,
      date: (tx.date as Date).toISOString(),
      type: String(tx.type).toLowerCase() as 'sent' | 'received' | 'mining_reward' | 'node_bonus',
      amount: Number(tx.amount),
      status: String(tx.status).toLowerCase() as 'completed' | 'pending' | 'failed',
      from: (tx as any).from || undefined,
      to: (tx as any).to || undefined,
      description: (tx as any).description || 'Transaction',
      blockExplorerUrl: (tx as any).blockExplorerUrl || undefined,
      txid: (tx as any).txid || undefined,
    }));

    const mockTransactions = [
      {
        id: 'tx_001',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        type: 'mining_reward' as const,
        amount: 0.5,
        status: 'completed' as const,
        description: 'Mining reward for active participation',
         blockExplorerUrl: 'https://blockexplorer.minepi.com/testnet/transactions/txid_12345',
        txid: 'txid_12345'
      },
      {
        id: 'tx_002',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        type: 'sent' as const,
        amount: 10.0,
        status: 'completed' as const,
        from: user.username,
        to: 'alice_miner',
        description: 'Payment for services',
         blockExplorerUrl: 'https://blockexplorer.minepi.com/testnet/transactions/txid_12344',
        txid: 'txid_12344'
      },
      {
        id: 'tx_003',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        type: 'received' as const,
        amount: 5.0,
        status: 'completed' as const,
        from: 'bob_validator',
        to: user.username,
        description: 'Team bonus payment',
         blockExplorerUrl: 'https://blockexplorer.minepi.com/testnet/transactions/txid_12343',
        txid: 'txid_12343'
      },
      {
        id: 'tx_004',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        type: 'node_bonus' as const,
        amount: 2.5,
        status: 'completed' as const,
        description: 'Node operation bonus',
         blockExplorerUrl: 'https://blockexplorer.minepi.com/testnet/transactions/txid_12342',
        txid: 'txid_12342'
      },
      {
        id: 'tx_005',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
        type: 'mining_reward' as const,
        amount: 0.3,
        status: 'pending' as const,
        description: 'Mining reward (pending verification)',
        blockExplorerUrl: null,
        txid: null
      },
      {
        id: 'tx_006',
        date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks ago
        type: 'sent' as const,
        amount: 2.0,
        status: 'failed' as const,
        from: user.username,
        to: 'invalid_wallet',
        description: 'Failed transaction to invalid wallet',
        blockExplorerUrl: null,
        txid: null
      }
    ];

    // Choose source: DB first, else mocks
    const source = normalizedDb.length > 0 ? normalizedDb : mockTransactions;

    // Filter by type if provided
    let filteredTransactions = source as typeof mockTransactions;
    if (type && type !== 'all') {
      filteredTransactions = filteredTransactions.filter(tx => tx.type === type);
    }

    // Apply pagination
    const paginatedTransactions = filteredTransactions.slice(offset, offset + limit);

    // Calculate statistics
    const totalTransactions = filteredTransactions.length;
    const totalAmount = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const completedTransactions = filteredTransactions.filter(tx => tx.status === 'completed').length;

    return NextResponse.json({
      success: true,
      transactions: paginatedTransactions,
      pagination: {
        total: totalTransactions,
        limit,
        offset,
        hasMore: offset + limit < totalTransactions
      },
      statistics: {
        totalAmount: Math.round(totalAmount * 100) / 100,
        completedCount: completedTransactions,
        pendingCount: filteredTransactions.filter(tx => tx.status === 'pending').length,
        failedCount: filteredTransactions.filter(tx => tx.status === 'failed').length
      }
    });
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, amount, description, to } = body;

    // Validate required fields
    if (!type || !amount || !description) {
      return NextResponse.json(
        { error: 'Type, amount, and description are required' },
        { status: 400 }
      );
    }

    // Mock transaction creation
    const newTransaction = {
      id: `tx_${Date.now()}`,
      date: new Date().toISOString(),
      type: type as any,
      amount: parseFloat(amount),
      status: 'pending' as const,
      from: user.username,
      to: to || null,
      description,
      blockExplorerUrl: null,
      txid: null
    };

    console.log('New transaction created:', newTransaction);

    return NextResponse.json({
      success: true,
      transaction: newTransaction,
      message: 'Transaction created successfully'
    });
  } catch (error) {
    console.error('Failed to create transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
} 