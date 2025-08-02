'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TeamMember } from '@/data/schemas';
import { UsersIcon, TrendingUpIcon, ClockIcon } from '@/components/shared/icons';

interface TeamStatsProps {
  team: TeamMember[];
  userWeeklyActivity: number;
}

export function TeamStats({ team, userWeeklyActivity }: TeamStatsProps) {
  const activeMembers = team.filter(m => m.status === 'active').length;
  const totalMembers = team.length;
  const inactiveMembers = totalMembers - activeMembers;

  const totalWeeklyActivity = team
    .filter(m => m.status === 'active')
    .reduce((sum, m) => sum + (m.teamMemberActiveMiningHours_LastWeek || 0), 0) + userWeeklyActivity;

  const averageWeeklyActivity = totalMembers > 0 ? Math.round(totalWeeklyActivity / totalMembers) : 0;

  const kycCompleted = team.filter(m => m.kycStatus === 'completed').length;
  const kycPending = team.filter(m => m.kycStatus === 'pending').length;
  const kycNotCompleted = team.filter(m => m.kycStatus === 'not_completed').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMembers}</div>
          <div className="text-xs text-muted-foreground">
            {activeMembers} active, {inactiveMembers} inactive
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUpIcon className="h-4 w-4" />
            Weekly Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalWeeklyActivity}h</div>
          <div className="text-xs text-muted-foreground">
            Avg: {averageWeeklyActivity}h per member
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ClockIcon className="h-4 w-4" />
            Your Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userWeeklyActivity}h</div>
          <div className="text-xs text-muted-foreground">
            This week
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">KYC Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs">Completed</span>
            <Badge variant="success" className="text-xs">{kycCompleted}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs">Pending</span>
            <Badge variant="warning" className="text-xs">{kycPending}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs">Not Started</span>
            <Badge variant="destructive" className="text-xs">{kycNotCompleted}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 