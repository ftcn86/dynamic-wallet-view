import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/session';
import { TeamService } from '@/services/databaseService';
import type { TeamMember } from '@/data/schemas';

// Mock team members data (in production, this would come from a database)
const mockTeamMembers = [
  {
    id: 'member_1',
    name: 'Alice Miner',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    joinDate: '2024-01-15T10:30:00Z',
    status: 'active' as const,
    unverifiedPiContribution: 45.2,
    teamMemberActiveMiningHours_LastWeek: 168,
    teamMemberActiveMiningHours_LastMonth: 720,
    kycStatus: 'completed' as const,
    dataAiHint: 'Highly active team member with consistent mining'
  },
  {
    id: 'member_2',
    name: 'Bob Validator',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    joinDate: '2024-01-20T14:15:00Z',
    status: 'active' as const,
    unverifiedPiContribution: 32.8,
    teamMemberActiveMiningHours_LastWeek: 156,
    teamMemberActiveMiningHours_LastMonth: 680,
    kycStatus: 'completed' as const,
    dataAiHint: 'Reliable team member with good mining consistency'
  },
  {
    id: 'member_3',
    name: 'Carol Node',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
    joinDate: '2024-02-01T09:45:00Z',
    status: 'pending' as const,
    unverifiedPiContribution: 18.5,
    teamMemberActiveMiningHours_LastWeek: 72,
    teamMemberActiveMiningHours_LastMonth: 240,
    kycStatus: 'pending' as const,
    dataAiHint: 'New team member, still completing KYC verification'
  },
  {
    id: 'member_4',
    name: 'David Explorer',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    joinDate: '2024-01-10T16:20:00Z',
    status: 'inactive' as const,
    unverifiedPiContribution: 12.3,
    teamMemberActiveMiningHours_LastWeek: 0,
    teamMemberActiveMiningHours_LastMonth: 24,
    kycStatus: 'completed' as const,
    dataAiHint: 'Inactive team member, may need re-engagement'
  },
  {
    id: 'member_5',
    name: 'Eve Pioneer',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eve',
    joinDate: '2024-01-25T11:00:00Z',
    status: 'active' as const,
    unverifiedPiContribution: 28.7,
    teamMemberActiveMiningHours_LastWeek: 144,
    teamMemberActiveMiningHours_LastMonth: 600,
    kycStatus: 'completed' as const,
    dataAiHint: 'Consistent team member with steady mining activity'
  }
];

/**
 * GET /api/team/members
 * Get all team members for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from database session (NEW: Proper session management)
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'joinDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Try DB first
    let members: TeamMember[];
    try {
      members = await TeamService.getUserTeamMembers(user.id) as unknown as TeamMember[];
    } catch {
      members = [] as TeamMember[];
    }
    // Fallback to mocks only during development
    if ((!members || members.length === 0) && process.env.NODE_ENV === 'development') {
      members = mockTeamMembers as unknown as typeof members;
    }

    // Filter by status if provided
    let filteredMembers: TeamMember[] = members;
    if (status && status !== 'all') {
      filteredMembers = members.filter(member => member.status === status);
    }

    // Sort members
    filteredMembers.sort((a: TeamMember, b: TeamMember) => {
      let aValue: number | string = '';
      let bValue: number | string = '';

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'contribution':
          aValue = a.unverifiedPiContribution;
          bValue = b.unverifiedPiContribution;
          break;
        case 'joinDate':
        default:
          aValue = new Date(a.joinDate).getTime();
          bValue = new Date(b.joinDate).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Calculate team statistics
    const activeMembers = filteredMembers.filter(m => m.status === 'active').length;
    const totalContribution = filteredMembers.reduce((sum, m) => sum + (m.unverifiedPiContribution || 0), 0);
    const averageContribution = filteredMembers.length > 0 ? totalContribution / filteredMembers.length : 0;

    return NextResponse.json({
      success: true,
      members: filteredMembers,
      statistics: {
        total: filteredMembers.length,
        active: activeMembers,
        pending: filteredMembers.filter(m => m.status === 'pending').length,
        inactive: filteredMembers.filter(m => m.status === 'inactive').length,
        totalContribution: Math.round(totalContribution * 100) / 100,
        averageContribution: Math.round(averageContribution * 100) / 100
      }
    });
  } catch (error) {
    console.error('Failed to fetch team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/team/members
 * Ping inactive team members or send team message
 */
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
    const { action, memberId, message } = body;

    if (action === 'ping' && memberId) {
      // Simulate pinging an inactive member
      const member = mockTeamMembers.find(m => m.id === memberId);
      if (!member) {
        return NextResponse.json(
          { error: 'Team member not found' },
          { status: 404 }
        );
      }

      console.log(`Pinging inactive team member: ${member.name}`);
      return NextResponse.json({
        success: true,
        message: `Ping sent to ${member.name}`,
        memberId
      });
    }

    if (action === 'message' && message) {
      // Simulate sending a team message
      console.log(`Sending team message: ${message}`);
      return NextResponse.json({
        success: true,
        message: 'Team message sent successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to perform team action:', error);
    return NextResponse.json(
      { error: 'Failed to perform team action' },
      { status: 500 }
    );
  }
} 