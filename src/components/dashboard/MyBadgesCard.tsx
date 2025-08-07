
"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '../ui/skeleton';
import type { Badge } from '@/data/schemas';
import { format, parseISO } from 'date-fns';
import { BadgeIcon } from './badge/BadgeIcon';
import { AwardIcon, CheckCircleIcon } from '@/components/shared/icons';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { InfoBanner } from '../shared/InfoBanner';
import { getUserBadges } from '@/services/piService';

function BadgeItem({ badge }: { badge: Badge }) {
  const earnedDate = badge.earnedDate ? format(parseISO(badge.earnedDate), "MMMM dd, yyyy") : '';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="group relative flex cursor-pointer flex-col items-center space-y-2 rounded-lg border bg-card p-3 sm:p-4 text-center transition-all hover:bg-muted/50 hover:shadow-md">
          <BadgeIcon badgeId={badge.id} earned={badge.earned} size="lg" />
          <p className="w-full truncate text-xs sm:text-sm font-medium">{badge.name}</p>
          {!badge.earned && <div className="absolute inset-0 rounded-lg bg-black/20" />}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-center items-center">
            <BadgeIcon badgeId={badge.id} earned={badge.earned} size="xl" className="mb-4" />
          <DialogTitle className="text-2xl">{badge.name}</DialogTitle>
          <DialogDescription>{badge.description}</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {badge.earned && earnedDate && (
             <div className="flex items-center justify-center text-sm text-green-700 dark:text-green-300 bg-green-500/10 rounded-full px-4 py-2">
                <CheckCircleIcon className="mr-2 h-4 w-4" />
                <span>Earned on {earnedDate}</span>
             </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


export function MyBadgesCard() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getUserBadges()
      .then((data) => setBadges(data as Badge[]))
      .catch(() => setError('Failed to load badges. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return (
    <Card className="shadow-lg flex items-center justify-center min-h-[120px]">
      <LoadingSpinner size={24} />
    </Card>
  );

  if (error) return (
    <Card className="shadow-lg">
      <CardContent className="p-3 sm:p-4">
        <InfoBanner variant="destructive" title={error} onRetry={() => {
          setIsLoading(true);
          setError(null);
          getUserBadges()
            .then((data) => setBadges(data as Badge[]))
            .catch(() => setError('Failed to load badges. Please try again.'))
            .finally(() => setIsLoading(false));
        }} />
      </CardContent>
    </Card>
  );

  if (!badges.length) return (
    <Card className="shadow-lg">
      <CardContent>
        <div className="py-6">
          <p className="text-center text-muted-foreground">No badges earned yet.</p>
        </div>
      </CardContent>
    </Card>
  );

  const sortedBadges = [...(badges || [])].sort((a, b) => {
    if (a.earned === b.earned) return 0;
    return a.earned ? -1 : 1;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-lg sm:text-xl">
          <AwardIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          My Badges
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          View your earned badges and discover new ones to unlock.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {sortedBadges.map((badge) => (
            <BadgeItem key={badge.id} badge={badge} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
