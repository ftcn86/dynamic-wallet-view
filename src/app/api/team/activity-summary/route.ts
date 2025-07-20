import { NextRequest, NextResponse } from 'next/server';
import type { TeamMember, Badge } from '@/data/schemas';

// Mock team members data (in production, this would come from the database)
const mockTeamMembers: TeamMember[] = [
  {
    id: 'member_001',
    name: 'Alice Miner',
    joinDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    kycStatus: 'completed',
    teamMemberActiveMiningHours_LastWeek: 24,
    teamMemberActiveMiningHours_LastMonth: 168,
    avatarUrl: '',
    unverifiedPiContribution: 150.5,
  },
  {
    id: 'member_002',
    name: 'Bob Validator',
    joinDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    kycStatus: 'completed',
    teamMemberActiveMiningHours_LastWeek: 18,
    teamMemberActiveMiningHours_LastMonth: 120,
    avatarUrl: '',
    unverifiedPiContribution: 89.2,
  },
  {
    id: 'member_003',
    name: 'Charlie Node',
    joinDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    kycStatus: 'pending',
    teamMemberActiveMiningHours_LastWeek: 12,
    teamMemberActiveMiningHours_LastMonth: 84,
    avatarUrl: '',
    unverifiedPiContribution: 45.8,
  },
  {
    id: 'member_004',
    name: 'Diana Pioneer',
    joinDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'inactive',
    kycStatus: 'completed',
    teamMemberActiveMiningHours_LastWeek: 0,
    teamMemberActiveMiningHours_LastMonth: 12,
    avatarUrl: '',
    unverifiedPiContribution: 234.1,
  },
  {
    id: 'member_005',
    name: 'Edward Miner',
    joinDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    kycStatus: 'not_completed',
    teamMemberActiveMiningHours_LastWeek: 8,
    teamMemberActiveMiningHours_LastMonth: 8,
    avatarUrl: '',
    unverifiedPiContribution: 12.3,
  },
];

// Mock badges data
const mockBadges: Badge[] = [
  {
    id: 'b_wmara',
    name: 'Weekly Mining Marathoner',
    description: 'Mined for 7 consecutive days',
    iconUrl: '/badges/weekly-marathoner.png',
    earned: true,
    earnedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'b_twtm',
    name: 'Team\'s Weekly Top Miner',
    description: 'Highest mining hours in your team this week',
    iconUrl: '/badges/top-miner.png',
    earned: true,
    earnedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'b_atl',
    name: 'Active Team Leader',
    description: '75% of your team members are active',
    iconUrl: '/badges/team-leader.png',
    earned: true,
    earnedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * GET /api/team/activity-summary
 * Get team activity summary for the "Team Mining Rally"
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

    // Get active team members only
    const activeMembers = mockTeamMembers.filter(m => m.status === 'active');

    // Sort by weekly mining hours (descending)
    const topMembers = activeMembers
      .sort((a, b) => (b.teamMemberActiveMiningHours_LastWeek || 0) - (a.teamMemberActiveMiningHours_LastWeek || 0))
      .slice(0, 5); // Top 5 members

    // Calculate current user's rank (assuming current user is Alice Miner for demo)
    const currentUserHours = 24; // Mock current user's hours
    const userRank = activeMembers.filter(m => (m.teamMemberActiveMiningHours_LastWeek || 0) > currentUserHours).length + 1;

    // Get user's 3 most recently earned badges
    const recentBadges = mockBadges
      .filter(b => b.earned)
      .sort((a, b) => new Date(b.earnedDate || '').getTime() - new Date(a.earnedDate || '').getTime())
      .slice(0, 3);

    return NextResponse.json({
      success: true,
      topMembers,
      userRank,
      recentBadges,
      teamStats: {
        totalMembers: mockTeamMembers.length,
        activeMembers: activeMembers.length,
        averageWeeklyHours: activeMembers.reduce((sum, m) => sum + (m.teamMemberActiveMiningHours_LastWeek || 0), 0) / activeMembers.length,
      },
    });
  } catch (error) {
    console.error('Failed to fetch team activity summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team activity summary' },
      { status: 500 }
    );
  }
} 