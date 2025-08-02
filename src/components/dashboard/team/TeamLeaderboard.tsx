'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TeamMember } from '@/data/schemas';
import { TrophyIcon, AwardIcon } from '@/components/shared/icons';

interface TeamLeaderboardProps {
  team: TeamMember[];
  maxEntries?: number;
  userRank?: number;
}

export function TeamLeaderboard({ team, maxEntries = 5, userRank }: TeamLeaderboardProps) {
  const leaderboard = team
    .filter(member => member.status === 'active' && typeof member.teamMemberActiveMiningHours_LastWeek === 'number')
    .map(member => ({
      ...member,
      activity: member.teamMemberActiveMiningHours_LastWeek!,
    }))
    .sort((a, b) => b.activity - a.activity)
    .slice(0, maxEntries);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <TrophyIcon className="h-4 w-4 text-yellow-500" />;
      case 1:
        return <AwardIcon className="h-4 w-4 text-gray-400" />;
      case 2:
        return <AwardIcon className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Weekly Activity Leaderboard</h3>
        {userRank && (
          <Badge variant="outline" className="text-xs">
            Your Rank: #{userRank}
          </Badge>
        )}
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Rank</TableHead>
            <TableHead>Member</TableHead>
            <TableHead className="text-right">Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboard.map((member, index) => (
            <TableRow key={member.id}>
              <TableCell className="w-12">
                <div className="flex items-center justify-center">
                  {getRankIcon(index)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                    <AvatarFallback className="text-xs">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate">{member.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-sm font-medium">{member.activity}h</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 