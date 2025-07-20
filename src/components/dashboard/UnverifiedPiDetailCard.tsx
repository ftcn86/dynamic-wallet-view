
"use client"

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { 
    UsersIcon, 
    ShieldIcon, 
    GiftIcon, 
    ListTreeIcon, 
    ServerIcon
} from '@/components/shared/icons';


interface UnverifiedPiSource {
  key: keyof NonNullable<ReturnType<typeof useAuth>['user']>['unverifiedPiDetails'];
  label: string;
  icon: JSX.Element;
  value: number;
}

export function UnverifiedPiDetailCard() {
  const { user } = useAuth();

  // Loading state
  if (user === null) return (
     <Card className={cn("shadow-lg")}>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
      </CardContent>
    </Card>
  );

  // Conditional Rendering: Only show the card if the detailed data exists and is not empty.
  // In a real app, if the Pi API doesn't provide this breakdown, this object would be null or empty.
  if (!user.unverifiedPiDetails || Object.values(user.unverifiedPiDetails).every(v => v === 0)) {
    return null;
  }

  const { fromReferralTeam, fromSecurityCircle, fromNodeRewards, fromOtherBonuses } = user.unverifiedPiDetails;

  const sources: UnverifiedPiSource[] = [
    { key: 'fromReferralTeam', label: 'From Referral Team', icon: <UsersIcon className="h-5 w-5" />, value: fromReferralTeam },
    { key: 'fromSecurityCircle', label: 'From Security Circle', icon: <ShieldIcon className="h-5 w-5" />, value: fromSecurityCircle },
    { key: 'fromNodeRewards', label: 'From Node Rewards', icon: <ServerIcon className="h-5 w-5" />, value: fromNodeRewards },
    { key: 'fromOtherBonuses', label: 'From Other Bonuses', icon: <GiftIcon className="h-5 w-5" />, value: fromOtherBonuses },
  ];

  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300")}>
      <CardHeader>
        <CardTitle className="font-headline flex items-center">
          <ListTreeIcon className="mr-2 h-6 w-6" />
          Unverified Pi Sources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sources.map((source) => (
          <div key={source.key} className="flex items-center justify-between">
            <div className="flex items-center text-sm text-muted-foreground">
              {source.icon}
              <span className="ml-2">{source.label}</span>
            </div>
            <span className="font-mono font-medium">{source.value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} π</span>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">These amounts become transferable as your connections complete KYC.</p>
      </CardFooter>
    </Card>
  );
}
