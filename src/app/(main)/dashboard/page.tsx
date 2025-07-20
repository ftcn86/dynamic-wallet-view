
"use client"

import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { BalanceBreakdownCard } from '@/components/dashboard/BalanceBreakdownCard';
import { BalanceFluctuationChartCard } from '@/components/dashboard/BalanceFluctuationChartCard';
import { MiningFocusCard } from '@/components/dashboard/MiningFocusCard';
import { TeamActivityCard } from '@/components/dashboard/TeamActivityCard';
import { MyBadgesCard } from '@/components/dashboard/MyBadgesCard';
import { UnverifiedPiDetailCard } from '@/components/dashboard/UnverifiedPiDetailCard';
import { LockupCalculatorCard } from '@/components/dashboard/LockupCalculatorCard';
import { AIFeatureFeedbackCard } from '@/components/dashboard/AIFeatureFeedbackCard';
import NativeFeaturesCard from '@/components/dashboard/NativeFeaturesCard';
import RewardedAdsCard from '@/components/dashboard/RewardedAdsCard';
import WalletAddressCard from '@/components/dashboard/WalletAddressCard';

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:gap-6 lg:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-4 md:space-y-6 lg:space-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Welcome back, {user.name}! Here's your Pi Network overview.
          </p>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid gap-4 md:gap-6 lg:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<DashboardSkeleton />}>
          <BalanceBreakdownCard />
          <BalanceFluctuationChartCard />
          <MiningFocusCard />
          <TeamActivityCard />
          <MyBadgesCard />
          <UnverifiedPiDetailCard />
          <LockupCalculatorCard />
          <WalletAddressCard user={user} />
          <NativeFeaturesCard />
          <RewardedAdsCard />
          <AIFeatureFeedbackCard />
        </Suspense>
      </div>
    </div>
  );
}
