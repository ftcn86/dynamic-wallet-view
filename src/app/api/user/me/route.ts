import { NextRequest, NextResponse } from 'next/server';
import { getUserPiBalance, getTeamMembers, getNodeData, getTransactions } from '@/services/piService';
import type { User } from '@/data/schemas';

/**
 * User Data API Endpoint
 * 
 * Following the official demo repository pattern with fallback support:
 * 1. Get user from session cookie
 * 2. Return user data with Pi Network information
 * 3. Fallback to mock data if database is unavailable
 */

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie (following demo pattern)
    const sessionCookie = request.cookies.get('pi-session');
    
    if (!sessionCookie?.value) {
      console.log('❌ No session cookie found');
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
      console.log('❌ No userId in session data');
      return NextResponse.json(
        { error: 'Invalid session data' },
        { status: 401 }
      );
    }

    console.log('✅ Session validated, userId:', sessionData.userId);

    // Try to get user from database first
    let user: any = null;
    let useFallback = false;

    try {
      const { UserService } = await import('@/services/databaseService');
      user = await UserService.getUserById(sessionData.userId);
      
      if (!user) {
        console.log('⚠️ User not found in database, using fallback data');
        useFallback = true;
      } else {
        console.log('✅ User found in database:', user.username);
      }
    } catch (dbError) {
      console.error('❌ Database error, using fallback data:', dbError);
      useFallback = true;
    }

    // Fallback to session data if database is unavailable
    if (useFallback) {
      user = {
        id: sessionData.userId,
        username: sessionData.username || 'user',
        name: sessionData.username || 'User',
        email: '',
        walletAddress: '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionData.username || 'user'}`,
        bio: '',
        balance: 0,
        miningRate: 0,
        teamSize: 0,
        isNodeOperator: false,
        kycStatus: 'verified',
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        termsAccepted: true,
        settings: {
          theme: 'system',
          language: 'en',
          notifications: true,
          emailNotifications: false,
          remindersEnabled: false,
          reminderHoursBefore: 1,
        },
        balanceBreakdown: {
          transferableToMainnet: 0,
          totalUnverifiedPi: 0,
          currentlyInLockups: 0,
        },
        unverifiedPiDetails: {
          fromReferralTeam: 0,
          fromSecurityCircle: 0,
          fromNodeRewards: 0,
          fromOtherBonuses: 0,
        },
        badges: [],
        userActiveMiningHours_LastWeek: 0,
        userActiveMiningHours_LastMonth: 0,
        activeMiningDays_LastWeek: 0,
        activeMiningDays_LastMonth: 0,
      };
    }

    // Get additional Pi Network data (with fallback)
    let piBalance = 0;
    let teamMembers: any[] = [];
    let nodeData: any = null;
    let transactions: any[] = [];

    try {
      // Use access token from session for Pi Network API calls
      if (sessionData.accessToken) {
        console.log('🔍 Fetching Pi Network data...');
        const balanceResult = await getUserPiBalance();
        piBalance = typeof balanceResult === 'number' ? balanceResult : 0;
        teamMembers = await getTeamMembers();
        nodeData = await getNodeData();
        transactions = await getTransactions();
        console.log('✅ Pi Network data fetched successfully');
      }
    } catch (error) {
      console.error('⚠️ Pi Network API error (using fallback data):', error);
      // Continue with fallback data
    }

    // Return comprehensive user data
    const responseData = {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        avatar: user.avatar,
        bio: user.bio,
        balance: piBalance,
        miningRate: user.miningRate || 0,
        teamSize: teamMembers.length,
        isNodeOperator: user.isNodeOperator || false,
        kycStatus: user.kycStatus || 'verified',
        joinDate: user.joinDate,
        lastActive: user.lastActive,
        termsAccepted: user.termsAccepted,
        settings: user.settings,
        balanceBreakdown: user.balanceBreakdown,
        unverifiedPiDetails: user.unverifiedPiDetails,
        badges: user.badges || [],
        userActiveMiningHours_LastWeek: user.userActiveMiningHours_LastWeek || 0,
        userActiveMiningHours_LastMonth: user.userActiveMiningHours_LastMonth || 0,
        activeMiningDays_LastWeek: user.activeMiningDays_LastWeek || 0,
        activeMiningDays_LastMonth: user.activeMiningDays_LastMonth || 0,
      },
      piData: {
        balance: piBalance,
        teamMembers: teamMembers,
        nodeData: nodeData,
        transactions: transactions,
      },
      useFallback: useFallback
    };

    console.log('✅ User data returned successfully');
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ User data API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
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