import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/services/databaseService';

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

    const accessToken = authHeader.substring(7);
    
    // Validate Pi Network access token and get user
    const { UserService } = await import('@/services/databaseService');
    
    let userId: string;
    try {
      // Find user by access token
      const user = await UserService.getUserByAccessToken(accessToken);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid access token' },
          { status: 401 }
        );
      }
      
      userId = (user as any).id;
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch transactions from DB
    const { transactions, total } = await TransactionService.getUserTransactions(userId, page, limit);
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
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    
    // Validate Pi Network access token and get user
    const { UserService } = await import('@/services/databaseService');
    
    let userId: string;
    try {
      // Find user by access token
      const user = await UserService.getUserByAccessToken(accessToken);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid access token' },
          { status: 401 }
        );
      }
      
      userId = (user as any).id;
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    const { type, amount, status, from, to, description, blockExplorerUrl } = await request.json();

    if (!type || !amount || !status || !description) {
      return NextResponse.json(
        { error: 'Type, amount, status, and description are required' },
        { status: 400 }
      );
    }

    const newTransaction = await TransactionService.createTransaction(userId, {
      type,
      amount: parseFloat(amount),
      status,
      from,
      to,
      description,
      blockExplorerUrl: blockExplorerUrl || undefined,
    });

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