import { NextRequest, NextResponse } from 'next/server';
import type { TeamMember } from '@/data/schemas';

// In-memory storage for team members (in production, this would be a database)
let teamMembers: TeamMember[] = [
  {
    id: 'member_001',
    name: 'Alice Miner',
    joinDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
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
    joinDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
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
    joinDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
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
    joinDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
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
    joinDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    status: 'active',
    kycStatus: 'not_completed',
    teamMemberActiveMiningHours_LastWeek: 8,
    teamMemberActiveMiningHours_LastMonth: 8,
    avatarUrl: '',
    unverifiedPiContribution: 12.3,
  },
];

/**
 * GET /api/team/members
 * Get team members with optional sorting
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
    const sortBy = searchParams.get('sortBy') || 'joinDate';
    const order = searchParams.get('order') || 'desc';

    // Create a copy of team members for sorting
    let sortedMembers = [...teamMembers];

    // Apply sorting
    sortedMembers.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'joinDate':
          aValue = new Date(a.joinDate).getTime();
          bValue = new Date(b.joinDate).getTime();
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'kycStatus':
          aValue = a.kycStatus;
          bValue = b.kycStatus;
          break;
        case 'teamMemberActiveMiningHours_LastWeek':
          aValue = a.teamMemberActiveMiningHours_LastWeek;
          bValue = b.teamMemberActiveMiningHours_LastWeek;
          break;
        case 'teamMemberActiveMiningHours_LastMonth':
          aValue = a.teamMemberActiveMiningHours_LastMonth;
          bValue = b.teamMemberActiveMiningHours_LastMonth;
          break;
        default:
          aValue = new Date(a.joinDate).getTime();
          bValue = new Date(b.joinDate).getTime();
      }

      if (order === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    // Calculate team statistics
    const activeMembers = sortedMembers.filter(m => m.status === 'active').length;
    const totalMembers = sortedMembers.length;
    const kycCompleted = sortedMembers.filter(m => m.kycStatus === 'completed').length;

    return NextResponse.json({
      success: true,
      members: sortedMembers,
      statistics: {
        active: activeMembers,
        total: totalMembers,
        kycCompleted,
        kycPending: sortedMembers.filter(m => m.kycStatus === 'pending').length,
        kycNotStarted: sortedMembers.filter(m => m.kycStatus === 'not_completed').length,
      },
    });
  } catch (error) {
    console.error('Failed to fetch team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
} 