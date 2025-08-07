import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // Mock user profile data (in production, this would come from a database)
    const userProfile = {
      id: user.id,
      username: user.username,
      name: user.username,
      email: 'user@example.com',
      walletAddress: 'GABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
      bio: 'Active Pi Network user and community member',
      balance: 125.75,
      miningRate: 0.12,
      teamSize: 5,
      isNodeOperator: true,
      nodeUptimePercentage: 98.5,
      kycStatus: 'verified' as const,
      joinDate: '2023-06-15T10:30:00Z',
      lastActive: new Date().toISOString(),
      termsAccepted: true,
      balanceBreakdown: {
        transferableToMainnet: 85.25,
        totalUnverifiedPi: 40.5,
        currentlyInLockups: 0
      },
      unverifiedPiDetails: {
        fromReferralTeam: 15.2,
        fromSecurityCircle: 12.8,
        fromNodeRewards: 8.5,
        fromOtherBonuses: 4.0
      },
      badges: [
        {
          id: 'badge_1',
          name: 'Early Adopter',
          description: 'Joined Pi Network in the early days',
          iconUrl: '/badges/early-adopter.svg',
          earned: true,
          earnedDate: '2023-06-15T10:30:00Z'
        },
        {
          id: 'badge_2',
          name: 'Team Leader',
          description: 'Successfully leads an active earning team',
          iconUrl: '/badges/team-leader.svg',
          earned: true,
          earnedDate: '2023-08-20T14:15:00Z'
        },
        {
          id: 'badge_3',
          name: 'Node Operator',
          description: 'Runs a Pi Node successfully',
          iconUrl: '/badges/node-operator.svg',
          earned: true,
          earnedDate: '2023-09-10T09:45:00Z'
        }
      ],
      userActiveMiningHours_LastWeek: 168,
      userActiveMiningHours_LastMonth: 720,
      activeMiningDays_LastWeek: 7,
      activeMiningDays_LastMonth: 30,
      settings: {
        theme: 'system',
        language: 'en',
        notifications: true,
        emailNotifications: false,
        remindersEnabled: true,
        reminderHoursBefore: 1
      }
    };

    return NextResponse.json({
      success: true,
      profile: userProfile
    });
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, bio, email, settings } = body;

    // Validate input
    if (name && typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name must be a string' },
        { status: 400 }
      );
    }

    if (bio && typeof bio !== 'string') {
      return NextResponse.json(
        { error: 'Bio must be a string' },
        { status: 400 }
      );
    }

    if (email && typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email must be a string' },
        { status: 400 }
      );
    }

    // Mock profile update (in production, this would update a database)
    console.log('Updating user profile:', { name, bio, email, settings });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      updatedFields: Object.keys(body)
    });
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
} 