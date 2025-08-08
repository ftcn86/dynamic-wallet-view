'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getPiSDKInstance } from '@/lib/pi-network';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/data/schemas';
import { Gift } from 'lucide-react';
import { notifyAdRewardEarned, notifyAdNotAvailable } from '@/services/notificationService';
import { NotificationService } from '@/services/databaseService';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { AdPlayer } from './ads/AdPlayer';
import { AdRewardDisplay } from './ads/AdRewardDisplay';
import { AdStats } from './ads/AdStats';
import { Badge } from '@/components/ui/badge';

const MAX_DAILY_WATCHES = 10;
const REWARD_AMOUNT = 0.01; // 0.01 Pi per ad

export default function RewardedAdsCard() {
  const { user } = useAuth() as { user: User | null };
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdReady, setIsAdReady] = useState(true);
  const [dailyWatches, setDailyWatches] = useState(0);
  const [lastRewardTime, setLastRewardTime] = useState<Date | null>(null);
  const [cooldownMs, setCooldownMs] = useState<number>(0);
  const [cooldownTick, setCooldownTick] = useState<number>(0);

  useEffect(() => {
    if (user) {
      checkAdReadiness();
      loadDailyStats();
    }
  }, [user]);

  const checkAdReadiness = async () => {
    try {
      const response = await fetch('/api/ads/readiness', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAdReady(data.canWatch);
      } else {
        setIsAdReady(false);
      }
    } catch (error) {
      console.error('Failed to check ad readiness:', error);
      setIsAdReady(false);
    }
  };

  const loadDailyStats = async () => {
    try {
      const response = await fetch('/api/ads/stats', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDailyWatches(data.dailyWatches || 0);
        setLastRewardTime(data.lastRewardTime ? new Date(data.lastRewardTime) : null);
        // Simple cooldown estimation: 2 minutes from lastRewardTime
        if (data.lastRewardTime) {
          const last = new Date(data.lastRewardTime).getTime();
          const diff = 2 * 60 * 1000 - (Date.now() - last);
          setCooldownMs(Math.max(0, diff));
        } else {
          setCooldownMs(0);
        }
      } else if (process.env.NODE_ENV === 'development') {
        // Dev-only fallback to localStorage
        const today = new Date().toDateString();
        const stored = localStorage.getItem('rewardedAdsStats');
        if (stored) {
          const stats = JSON.parse(stored);
          if (stats.date === today) {
            setDailyWatches(stats.watches || 0);
            setLastRewardTime(stats.lastRewardTime ? new Date(stats.lastRewardTime) : null);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load daily stats:', error);
    }
  };

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownMs <= 0) return;
    setCooldownTick(cooldownMs);
    const interval = setInterval(() => {
      setCooldownTick((t) => {
        const next = Math.max(0, t - 1000);
        if (next === 0) clearInterval(interval);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownMs]);

  const handleAdComplete = async (rewarded: boolean) => {
    if (!user) return;

    try {
      // Update daily stats
      const newWatches = dailyWatches + 1;
      setDailyWatches(newWatches);
      
      if (rewarded) {
        setLastRewardTime(new Date());
        await grantReward();
        toast({
          title: "Reward earned!",
          description: `You've earned ${REWARD_AMOUNT} π for watching the ad.`,
        });
        try {
          if (user) {
            await NotificationService.createNotification(user.id, {
              type: 'badge_earned' as any,
              title: 'Ad Reward Earned! 🎬',
              description: `You earned ${REWARD_AMOUNT} Pi for watching an ad. Keep watching to earn more!`,
              link: '/dashboard?tab=achievements'
            });
          } else {
            await notifyAdRewardEarned(REWARD_AMOUNT);
          }
        } catch {}
      } else {
        toast({
          title: "Ad completed",
          description: "Thanks for watching! No reward this time.",
        });
      }

      // Save stats
      await saveDailyStats(rewarded);
      
      // Check ad readiness and cooldown for next time
      setTimeout(() => {
        checkAdReadiness();
        loadDailyStats();
      }, 1000);
      
    } catch (error) {
      console.error('Ad completion failed:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAdError = async (error: string) => {
    toast({
      title: "Ad failed",
      description: error,
      variant: "destructive",
    });
    try {
      if (user) {
        await NotificationService.createNotification(user.id, {
          type: 'announcement' as any,
          title: 'Ads Not Available',
          description: 'Rewarded ads are not currently available. Please try again later.',
          link: '/dashboard?tab=achievements'
        });
      } else {
        await notifyAdNotAvailable();
      }
    } catch {}
  };

  const grantReward = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/ads/view-complete', {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to grant reward');
      const data = await res.json();
      if (data.success !== true) {
        console.warn('View recorded but reward not granted:', data.reason);
      }
    } catch (error) {
      console.error('❌ Failed to grant reward:', error);
    }
  };

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

      // Dev-only fallback to localStorage
      if (process.env.NODE_ENV === 'development') {
        localStorage.setItem('rewardedAdsStats', JSON.stringify({
          date: today,
          watches: newWatches,
          lastRewardTime: rewarded ? new Date().toISOString() : lastRewardTime?.toISOString()
        }));
      }
    } catch (error) {
      console.error('Failed to save daily stats:', error);
    }
  };

  if (isLoading) return (
    <Card className="shadow-lg flex items-center justify-center min-h-[120px]">
      <LoadingSpinner size={24} />
    </Card>
  );

  if (!user) return (
    <Card className="shadow-lg flex flex-col items-center justify-center min-h-[120px] p-4 text-center">
      <span className="text-gray-500">Please log in to watch ads.</span>
    </Card>
  );

  const canWatchAd = isAdReady && !isLoading && dailyWatches < MAX_DAILY_WATCHES && cooldownTick === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            <span>Watch Ads for Pi</span>
          </div>
          <AdStats 
            dailyWatches={dailyWatches}
            maxDailyWatches={MAX_DAILY_WATCHES}
            lastRewardTime={lastRewardTime}
          />
          {cooldownTick > 0 && (
            <Badge variant="secondary" className="w-fit mt-1">
              Next ad in {Math.ceil(cooldownTick / 1000)}s
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AdRewardDisplay
          dailyWatches={dailyWatches}
          maxDailyWatches={MAX_DAILY_WATCHES}
          rewardAmount={REWARD_AMOUNT}
          isAdReady={isAdReady}
        />

        <AdPlayer
          onAdComplete={handleAdComplete}
          onAdError={handleAdError}
          disabled={!canWatchAd}
        />
      </CardContent>
    </Card>
  );
} 