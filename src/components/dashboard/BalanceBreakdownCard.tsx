
"use client"

import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/data/schemas';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';

export function BalanceBreakdownCard() {
  const { user: rawUser } = useAuth();
  const user = rawUser as User | null;

  if (!user) return (
    <Card className={cn("shadow-lg flex items-center justify-center min-h-[120px]")}>
      <LoadingSpinner size={24} />
    </Card>
  );

  if (!user.balanceBreakdown) {
    return (
      <Card className={cn("shadow-lg")}> 
        <CardContent>
          <EmptyState title="No balance breakdown" description="We couldn't find a breakdown for this account yet." />
        </CardContent>
      </Card>
    );
  }

  const breakdownItems = [
    { label: "Transferable to Mainnet", value: user.balanceBreakdown.transferableToMainnet },
    { label: "Total Unverified Pi", value: user.balanceBreakdown.totalUnverifiedPi },
    { label: "Currently in Lockups", value: user.balanceBreakdown.currentlyInLockups },
  ];

  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-all duration-300 min-h-[200px] flex flex-col")}>
      <CardHeader className="flex-shrink-0">
        <CardTitle className="font-headline text-lg sm:text-xl">Balance Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3 sm:space-y-4">
          {breakdownItems.map(item => (
            <li key={item.label} className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-muted-foreground truncate pr-2">{item.label}</span>
              <span className="font-mono font-medium flex-shrink-0">{item.value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} π</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex-shrink-0">
        <p className="text-xs text-muted-foreground leading-relaxed">Note: Unverified Pi requires associated members to complete KYC to become transferable.</p>
      </CardFooter>
    </Card>
  );
}
