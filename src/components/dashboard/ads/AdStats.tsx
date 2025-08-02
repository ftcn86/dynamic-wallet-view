'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

interface AdStatsProps {
  dailyWatches: number;
  maxDailyWatches: number;
  lastRewardTime: Date | null;
}

export function AdStats({ dailyWatches, maxDailyWatches, lastRewardTime }: AdStatsProps) {
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  useEffect(() => {
    const calculateTimeUntilReset = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeUntilReset(`${hours}h ${minutes}m`);
    };

    calculateTimeUntilReset();
    const interval = setInterval(calculateTimeUntilReset, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const saveDailyStats = async (rewarded: boolean) => {
    try {
      const today = new Date().toDateString();
      const newWatches = dailyWatches + 1;
      
      // Save to API
      await fetch('/api/ads/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          dailyWatches: newWatches,
          lastRewardTime: rewarded ? new Date().toISOString() : lastRewardTime?.toISOString(),
          rewarded
        })
      });

      // Fallback to localStorage
      localStorage.setItem('rewardedAdsStats', JSON.stringify({
        date: today,
        watches: newWatches,
        lastRewardTime: rewarded ? new Date().toISOString() : lastRewardTime?.toISOString()
      }));
    } catch (error) {
      console.error('Failed to save daily stats:', error);
    }
  };

  const loadDailyStats = async () => {
    try {
      const response = await fetch('/api/ads/stats', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          dailyWatches: data.dailyWatches || 0,
          lastRewardTime: data.lastRewardTime ? new Date(data.lastRewardTime) : null
        };
      }
    } catch (error) {
      console.error('Failed to load daily stats:', error);
    }

    // Fallback to localStorage
    const today = new Date().toDateString();
    const stored = localStorage.getItem('rewardedAdsStats');
    
    if (stored) {
      const stats = JSON.parse(stored);
      if (stats.date === today) {
        return {
          dailyWatches: stats.watches || 0,
          lastRewardTime: stats.lastRewardTime ? new Date(stats.lastRewardTime) : null
        };
      }
    }

    return { dailyWatches: 0, lastRewardTime: null };
  };

  return (
    <div className="flex items-center justify-between">
      <Badge variant="secondary" className="text-xs">
        {dailyWatches}/{maxDailyWatches} today
      </Badge>
      {timeUntilReset && (
        <span className="text-xs text-muted-foreground">
          Resets in {timeUntilReset}
        </span>
      )}
    </div>
  );
} 