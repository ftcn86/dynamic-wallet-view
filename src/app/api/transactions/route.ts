import { NextRequest, NextResponse } from 'next/server';
import type { Transaction } from '@/data/schemas';

// In-memory storage for transactions (in production, this would be a database)
let transactions: Transaction[] = [
  {
    id: 'tx_001',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    type: 'sent',
    amount: 10.5,
    status: 'completed',
    from: 'Current User',
    to: 'Dynamic Wallet View Project',
    description: 'Donation to support the project',
    blockExplorerUrl: 'https://explorer.pinet.com/tx/abc123def456',
  },
  {
    id: 'tx_002',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    type: 'mining_reward',
    amount: 2.3,
    status: 'completed',
    from: 'Pi Network',
    to: 'Current User',
    description: 'Mining reward for active session',
    blockExplorerUrl: 'https://explorer.pinet.com/tx/def456ghi789',
  },
  {
    id: 'tx_003',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    type: 'received',
    amount: 5.0,
    status: 'completed',
    from: 'Alice Miner',
    to: 'Current User',
    description: 'Payment for services',
    blockExplorerUrl: 'https://explorer.pinet.com/tx/ghi789jkl012',
  },
  {
    id: 'tx_004',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    type: 'node_bonus',
    amount: 1.8,
    status: 'completed',
    from: 'Pi Network',
    to: 'Current User',
    description: 'Node operation bonus',
    blockExplorerUrl: 'https://explorer.pinet.com/tx/jkl012mno345',
  },
  {
    id: 'tx_005',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    type: 'sent',
    amount: 3.2,
    status: 'completed',
    from: 'Current User',
    to: 'Bob Validator',
    description: 'Team contribution',
    blockExplorerUrl: 'https://explorer.pinet.com/tx/mno345pqr678',
  },
  {
    id: 'tx_006',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    type: 'mining_reward',
    amount: 2.1,
    status: 'completed',
    from: 'Pi Network',
    to: 'Current User',
    description: 'Mining reward for active session',
    blockExplorerUrl: 'https://explorer.pinet.com/tx/pqr678stu901',
  },
  {
    id: 'tx_007',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    type: 'received',
    amount: 8.5,
    status: 'completed',
    from: 'Charlie Node',
    to: 'Current User',
    description: 'Referral bonus',
    blockExplorerUrl: 'https://explorer.pinet.com/tx/stu901vwx234',
  },
  {
    id: 'tx_008',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    type: 'mining_reward',
    amount: 1.9,
    status: 'completed',
    from: 'Pi Network',
    to: 'Current User',
    description: 'Mining reward for active session',
    blockExplorerUrl: 'https://explorer.pinet.com/tx/vwx234yza567',
  },
];

/**
 * GET /api/transactions
 * Get transactions with pagination and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'date';
    const order = searchParams.get('order') || 'desc';

    // Create a copy of transactions for sorting
    let sortedTransactions = [...transactions];

    // Apply sorting
    sortedTransactions.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }

      if (order === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);

    // Calculate pagination metadata
    const totalTransactions = sortedTransactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      transactions: paginatedTransactions,
      pagination: {
        page,
        limit,
        totalTransactions,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions
 * Add a new transaction
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const { type, amount, status, from, to, description } = await request.json();

    if (!type || !amount || !status || !description) {
      return NextResponse.json(
        { error: 'Type, amount, status, and description are required' },
        { status: 400 }
      );
    }

    const newTransaction: Transaction = {
      id: `tx_${Date.now()}`,
      date: new Date().toISOString(),
      type: type as any,
      amount: parseFloat(amount),
      status: status as any,
      from,
      to,
      description,
      blockExplorerUrl: `https://explorer.pinet.com/tx/${Math.random().toString(36).substring(2, 15)}`,
    };

    transactions.unshift(newTransaction); // Add to beginning of array

    console.log('Transaction created:', newTransaction);

    return NextResponse.json({
      success: true,
      transaction: newTransaction,
    });
  } catch (error) {
    console.error('Failed to create transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
} 