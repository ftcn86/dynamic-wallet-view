import { NextRequest, NextResponse } from 'next/server';
import { getUserPiBalance, getTeamMembers, getNodeData, getTransactions } from '@/services/piService';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import type { User } from '@/data/schemas';

/**
 * User Data API Endpoint
 * 
 * This endpoint returns comprehensive user information including:
 * - Basic profile data
 * - Pi balance and mining information
 * - Team data
 * - Node status (if applicable)
 * - Transaction history
 * - Activity metrics
 */

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
    let me;
    
    try {
      me = await piPlatformClient.request('/v2/me', {
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

    // Get user from database using access token
    let userFromDb: any = null;
    
    try {
      const { UserService } = await import('@/services/databaseService');
      userFromDb = await UserService.getUserByAccessToken(accessToken);
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }
    
    if (!userFromDb) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = (userFromDb as any).id;
    
    // Fetch all user data using session's Pi access token
    const [balanceData, teamMembers, nodeData, transactions] = await Promise.all([
      getUserPiBalance(),
      getTeamMembers(),
      getNodeData(),
      getTransactions(),
    ]);

    // Calculate activity metrics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Mock activity calculations (in real app, this would come from database)
    const userActiveMiningHours_LastWeek = Math.floor(Math.random() * 24) + 1;
    const userActiveMiningHours_LastMonth = Math.floor(Math.random() * 168) + 24;
    const activeMiningDays_LastWeek = Math.floor(Math.random() * 7) + 1;
    const activeMiningDays_LastMonth = Math.floor(Math.random() * 30) + 7;

    // Use database user data
    const userData: User = {
      id: userId,
      username: (userFromDb as any).username || 'unknown',
      name: (userFromDb as any).name || 'Unknown User',
      email: (userFromDb as any).email || '',
      avatar: (userFromDb as any).avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown',
      bio: (userFromDb as any).bio || '',
      balance: (balanceData as { totalBalance: number }).totalBalance,
      miningRate: 0.0202, // Base rate + bonuses would be calculated
      isNodeOperator: nodeData.status !== 'offline',
      nodeUptimePercentage: nodeData.uptimePercentage,
      balanceBreakdown: (balanceData as { balanceBreakdown: any }).balanceBreakdown,
      unverifiedPiDetails: (balanceData as { unverifiedPiDetails: any }).unverifiedPiDetails,
      badges: [
        {
          id: 'first_mining_session',
          name: 'First Mining Session',
          description: 'Completed your first mining session',
          iconUrl: '/badges/first-mining.svg',
          earned: true,
          earnedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'team_builder',
          name: 'Team Builder',
          description: 'Successfully invited team members',
          iconUrl: '/badges/team-builder.svg',
          earned: teamMembers.length > 0,
          earnedDate: teamMembers.length > 0 ? new Date().toISOString() : undefined,
        },
      ],
      userActiveMiningHours_LastWeek,
      userActiveMiningHours_LastMonth,
      activeMiningDays_LastWeek,
      activeMiningDays_LastMonth,
      termsAccepted: true,
      settings: {
        theme: 'system',
        language: 'en',
        notifications: true,
        emailNotifications: false,
        remindersEnabled: true,
        reminderHoursBefore: 1,
      },
      walletAddress: (userFromDb as any).walletAddress || '',
      teamSize: (userFromDb as any).teamSize || 0,
      kycStatus: (userFromDb as any).kycStatus || 'verified',
      joinDate: (userFromDb as any).joinDate || new Date().toISOString(),
      lastActive: (userFromDb as any).lastActive || new Date().toISOString(),
      accessToken: '', // Don't include sensitive tokens
      refreshToken: '', // Don't include sensitive tokens
      tokenExpiresAt: 0, // Don't include sensitive tokens
    };

    return NextResponse.json({
      success: true,
      user: userData,
      // Additional data that might be useful
      teamMembers,
      nodeData,
      recentTransactions: transactions.slice(0, 10), // Last 10 transactions
      activityMetrics: {
        userActiveMiningHours_LastWeek,
        userActiveMiningHours_LastMonth,
        activeMiningDays_LastWeek,
        activeMiningDays_LastMonth,
      },
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