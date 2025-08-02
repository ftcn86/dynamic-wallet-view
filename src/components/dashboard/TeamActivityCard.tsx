
"use client"

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { User, TeamMember } from '@/data/schemas';
import { GAMIFICATION_BADGE_IDS } from '@/data/mocks';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { BadgeIcon } from './badge/BadgeIcon';
import { useTranslation } from '@/hooks/useTranslation';
import { ChevronRightIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getTeamMembers } from '@/services/piService';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { TeamLeaderboard } from './team/TeamLeaderboard';
import { TeamStats } from './team/TeamStats';

const DISPLAY_RECENT_BADGES_COUNT = 3;

export function TeamActivityCard() {
  const { user: rawUser } = useAuth();
  const user = rawUser as User | null;
  const { t } = useTranslation();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getTeamMembers()
      .then(setTeam)
      .catch(() => setError('Failed to load team data. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (!user) return (
     <Card className={cn("shadow-lg")}>
      <CardHeader className="pb-4">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
      <CardFooter className="pt-4">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );

  if (isLoading) return (
    <Card className={cn("shadow-lg flex items-center justify-center min-h-[120px]")}>
      <LoadingSpinner size={24} />
    </Card>
  );

  if (error) return (
    <Card className={cn("shadow-lg flex flex-col items-center justify-center min-h-[120px] p-4 text-center bg-red-50 border border-red-200")}> 
      <span className="text-red-700 font-medium">{error}</span>
    </Card>
  );

  if (!team.length) return (
    <Card className={cn("shadow-lg flex flex-col items-center justify-center min-h-[120px] p-4 text-center")}> 
      <span className="text-gray-500">No team members found.</span>
    </Card>
  );

  const userWeeklyActivity = user?.userActiveMiningHours_LastWeek ?? 0;

  // Calculate user rank
  const fullActivityList = [
    ...team.map(m => ({ name: m.name, activity: m.teamMemberActiveMiningHours_LastWeek || 0, id: m.id })),
    { name: user?.name, activity: userWeeklyActivity, id: user?.id }
  ];

  const uniqueActivityList = Array.from(new Map(fullActivityList.map(item => [item.id, item])).values())
                              .sort((a,b) => b.activity - a.activity);

  const userRankInFullList = uniqueActivityList.findIndex(u => u.id === user?.id) + 1;

  const userBadges = user?.badges || [];
  const earnedGamificationBadges = userBadges
    .filter(badge => GAMIFICATION_BADGE_IDS.includes(badge.id) && badge.earned)
    .slice(0, DISPLAY_RECENT_BADGES_COUNT);

  return (
    <Card className={cn("shadow-lg")}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <span>Team Activity</span>
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {t('teamInsights.description')}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <TeamStats 
          team={team}
          userWeeklyActivity={userWeeklyActivity}
        />

        <TeamLeaderboard 
          team={team}
          userRank={userRankInFullList}
        />

        {earnedGamificationBadges.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Recent Team Achievements</h3>
            <div className="flex flex-wrap gap-2">
              {earnedGamificationBadges.map((badge) => (
                <div key={badge.id} className="flex items-center gap-1">
                  <BadgeIcon
                    badgeId={badge.id}
                    earned={badge.earned}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4">
        <Link href="/dashboard/team" className="w-full">
          <Button variant="outline" className="w-full">
            View Full Team
            <ChevronRightIcon className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
