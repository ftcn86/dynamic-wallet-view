import { NextRequest, NextResponse } from 'next/server';
import { getTransactions } from '@/services/piService';
import { getSessionFromRequest } from '@/lib/session';

/**
 * GET /api/transactions
 * Get transactions with pagination and sorting
 */
export async function GET(request: NextRequest) {
  try {
    // Get session from request cookies
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.userId;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch transactions from database
    let transactions: any[] = [];
    let total = 0;
    
    try {
      const { TransactionService } = await import('@/services/databaseService');
      const result = await TransactionService.getUserTransactions(userId, page, limit);
      transactions = result.transactions;
      total = result.total;
    } catch (error) {
      console.log('⚠️ Using mock transactions due to error:', error);
      const mockTransactions = await getTransactions();
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      transactions = mockTransactions.slice(startIndex, endIndex);
      total = mockTransactions.length;
    }

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        totalTransactions: total,
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
    // Get session from request cookies
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.userId;

    const { type, amount, status, from, to, description, blockExplorerUrl } = await request.json();

    if (!type || !amount || !status || !description) {
      return NextResponse.json(
        { error: 'Type, amount, status, and description are required' },
        { status: 400 }
      );
    }

    let newTransaction: any;
    
    try {
      const { TransactionService } = await import('@/services/databaseService');
      newTransaction = await TransactionService.createTransaction(userId, {
        type,
        amount: parseFloat(amount),
        status,
        from,
        to,
        description,
        blockExplorerUrl: blockExplorerUrl || undefined,
      });
    } catch (error) {
      console.log('⚠️ Using mock transaction due to error:', error);
      newTransaction = {
        id: `mock-${Date.now()}`,
        userId,
        date: new Date(),
        type,
        amount: parseFloat(amount),
        status,
        from,
        to,
        description,
        blockExplorerUrl: blockExplorerUrl || undefined,
      };
    }

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