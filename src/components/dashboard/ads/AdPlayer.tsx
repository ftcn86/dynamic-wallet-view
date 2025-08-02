'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play } from 'lucide-react';

interface AdPlayerProps {
  onAdComplete: (rewarded: boolean) => void;
  onAdError: (error: string) => void;
  disabled?: boolean;
}

export function AdPlayer({ onAdComplete, onAdError, disabled = false }: AdPlayerProps) {
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [rewardProgress, setRewardProgress] = useState(0);

  const handleWatchAd = async () => {
    if (disabled) return;
    
    setIsWatchingAd(true);
    setRewardProgress(0);

    try {
      // Simulate ad watching progress
      const progressInterval = setInterval(() => {
        setRewardProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      // Simulate ad completion after 5 seconds
      setTimeout(() => {
        clearInterval(progressInterval);
        setRewardProgress(100);
        setIsWatchingAd(false);
        
        // Randomly determine if user gets reward (80% chance)
        const rewarded = Math.random() > 0.2;
        onAdComplete(rewarded);
      }, 5000);

    } catch (error) {
      setIsWatchingAd(false);
      setRewardProgress(0);
      onAdError('Failed to load ad');
    }
  };

  return (
    <div className="space-y-4">
      {isWatchingAd && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Watching ad...</span>
            <span>{rewardProgress}%</span>
          </div>
          <Progress value={rewardProgress} className="w-full" />
        </div>
      )}

      <Button
        onClick={handleWatchAd}
        disabled={disabled || isWatchingAd}
        className="w-full"
        size="lg"
      >
        {isWatchingAd ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        <span className="ml-2">
          {isWatchingAd ? 'Watching Ad...' : 'Watch Ad for Pi'}
        </span>
      </Button>
    </div>
  );
} 