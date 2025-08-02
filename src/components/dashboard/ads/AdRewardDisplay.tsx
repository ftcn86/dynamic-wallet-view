'use client';

import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface AdRewardDisplayProps {
  dailyWatches: number;
  maxDailyWatches: number;
  rewardAmount: number;
  isAdReady: boolean;
}

export function AdRewardDisplay({ 
  dailyWatches, 
  maxDailyWatches, 
  rewardAmount, 
  isAdReady 
}: AdRewardDisplayProps) {
  const hasReachedLimit = dailyWatches >= maxDailyWatches;

  if (!isAdReady) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Ads are not currently available. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (hasReachedLimit) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          You&apos;ve reached your daily limit. Come back tomorrow for more rewards!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted rounded-lg gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-medium">Reward per ad</div>
          <div className="text-sm text-muted-foreground">Watch a short video</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-bold text-lg">{rewardAmount} π</div>
          <div className="text-xs text-muted-foreground">Pi Network</div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Watch ads to earn Pi rewards</p>
        <p>• Limited to {maxDailyWatches} ads per day</p>
        <p>• Rewards are sent directly to your Pi wallet</p>
        <p>• Ads must be watched completely to earn rewards</p>
      </div>
    </div>
  );
} 