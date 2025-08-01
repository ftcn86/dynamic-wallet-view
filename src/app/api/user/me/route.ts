import { NextRequest, NextResponse } from 'next/server';
import { getUserPiBalance, getTeamMembers, getNodeData, getTransactions } from '@/services/piService';
import type { User } from '@/data/schemas';

/**
 * User Data API Endpoint
 * 
 * Following the official demo repository pattern:
 * 1. Get user from session cookie
 * 2. Return user data with Pi Network information
 * 3. No token validation needed (session-based)
 */

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

    // Get additional Pi Network data
    let piBalance = 0;
    let teamMembers: any[] = [];
    let nodeData: any = null;
    let transactions: any[] = [];

    try {
      // Use access token from session for Pi Network API calls
      if (sessionData.accessToken) {
        const balanceResult = await getUserPiBalance();
        piBalance = typeof balanceResult === 'number' ? balanceResult : 0;
        teamMembers = await getTeamMembers();
        nodeData = await getNodeData();
        transactions = await getTransactions();
      }
    } catch (error) {
      console.error('⚠️ Pi Network API error (using fallback data):', error);
      // Continue with fallback data
    }

    // Return comprehensive user data
    return NextResponse.json({
      success: true,
      user: {
        id: (user as any).id,
        username: (user as any).username,
        name: (user as any).name,
        email: (user as any).email,
        walletAddress: (user as any).walletAddress,
        avatar: (user as any).avatar,
        bio: (user as any).bio,
        balance: piBalance,
        miningRate: (user as any).miningRate || 0,
        teamSize: teamMembers.length,
        isNodeOperator: (user as any).isNodeOperator || false,
        kycStatus: (user as any).kycStatus || 'verified',
        joinDate: (user as any).joinDate,
        lastActive: (user as any).lastActive,
        termsAccepted: (user as any).termsAccepted,
        settings: (user as any).settings,
        balanceBreakdown: (user as any).balanceBreakdown,
        unverifiedPiDetails: (user as any).unverifiedPiDetails,
        badges: (user as any).badges || [],
        userActiveMiningHours_LastWeek: (user as any).userActiveMiningHours_LastWeek || 0,
        userActiveMiningHours_LastMonth: (user as any).userActiveMiningHours_LastMonth || 0,
        activeMiningDays_LastWeek: (user as any).activeMiningDays_LastWeek || 0,
        activeMiningDays_LastMonth: (user as any).activeMiningDays_LastMonth || 0,
      },
      piData: {
        balance: piBalance,
        teamMembers,
        nodeData,
        transactions: transactions.slice(0, 10), // Limit to recent transactions
      }
    });
  } catch (error) {
    console.error('User data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}

/**
 * Update user settings
 */
export async function PUT(request: NextRequest) {
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

    const { settings } = await request.json();

    // Update user settings in database
    try {
      await UserService.updateUser((user as any).id, { settings });
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
} 