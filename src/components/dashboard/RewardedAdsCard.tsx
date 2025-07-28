'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getPiSDKInstance } from '@/lib/pi-network';
import { sendA2UPayment } from '@/services/piService';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Gift, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { notifyAdRewardEarned, notifyDailyAdLimitReached, notifyAdNotAvailable } from '@/services/notificationService';
import { LoadingSpinner } from '../shared/LoadingSpinner';

export default function RewardedAdsCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [adsAvailable, setAdsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [rewardProgress, setRewardProgress] = useState(0);
  const [dailyWatches, setDailyWatches] = useState(0);
  const [lastRewardTime, setLastRewardTime] = useState<Date | null>(null);
  const [canPayReward, setCanPayReward] = useState<{ canPay: boolean; reason?: string }>({ canPay: false });

  const MAX_DAILY_WATCHES = 5;
  const REWARD_AMOUNT = 0.1; // 0.1 Pi per ad

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    // Simulate ad fetch
    setTimeout(() => {
      setAdsAvailable(false); // Simulate no ads for now
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) return (
    <Card className="shadow-lg flex items-center justify-center min-h-[120px]">
      <LoadingSpinner size={24} />
    </Card>
  );

  if (error) return (
    <Card className="shadow-lg flex flex-col items-center justify-center min-h-[120px] p-4 text-center bg-red-50 border border-red-200">
      <span className="text-red-700 font-medium">{error}</span>
    </Card>
  );

  if (!adsAvailable) return (
    <Card className="shadow-lg flex flex-col items-center justify-center min-h-[120px] p-4 text-center">
      <span className="text-gray-500">No rewarded ads available at the moment.</span>
    </Card>
  );

  useEffect(() => {
    checkAdReadiness();
    loadDailyStats();
    checkAppPaymentCapability();
  }, []);

  const checkAdReadiness = async () => {
    try {
      // For development, simulate ad availability
      setIsAdReady(Math.random() > 0.3); // 70% chance ad is ready
    } catch (error) {
      console.error('Failed to check ad readiness:', error);
      setIsAdReady(false);
    }
  };

  const loadDailyStats = () => {
    // Load from localStorage
    const today = new Date().toDateString();
    const stored = localStorage.getItem('rewardedAdsStats');
    
    if (stored) {
      const stats = JSON.parse(stored);
      if (stats.date === today) {
        setDailyWatches(stats.watches || 0);
        setLastRewardTime(stats.lastReward ? new Date(stats.lastReward) : null);
      } else {
        // Reset for new day
        setDailyWatches(0);
        setLastRewardTime(null);
        localStorage.setItem('rewardedAdsStats', JSON.stringify({
          date: today,
          watches: 0,
          lastReward: null
        }));
      }
    }
  };

  const saveDailyStats = (rewarded: boolean) => {
    const today = new Date().toDateString();
    const newWatches = rewarded ? dailyWatches + 1 : dailyWatches;
    const newLastReward = rewarded ? new Date().toISOString() : lastRewardTime?.toISOString();
    
    localStorage.setItem('rewardedAdsStats', JSON.stringify({
      date: today,
      watches: newWatches,
      lastReward: newLastReward
    }));
    
    setDailyWatches(newWatches);
    if (rewarded) {
      setLastRewardTime(new Date());
    }
  };

  const handleWatchAd = async () => {
    if (!user || dailyWatches >= MAX_DAILY_WATCHES) return;

    setIsLoading(true);
    setIsWatchingAd(true);
    setRewardProgress(0);

    try {
      const sdk = getPiSDKInstance();
      
      // Simulate ad progress
      const progressInterval = setInterval(() => {
        setRewardProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Simulate ad watching for development
      const result = { result: Math.random() > 0.2 ? 'AD_REWARDED' : 'AD_FAILED' };
      
      clearInterval(progressInterval);
      setRewardProgress(100);

      if (result.result === 'AD_REWARDED') {
        // Grant reward
        await grantReward();
        saveDailyStats(true);
        
        toast({
          title: "Reward earned! 🎉",
          description: `You earned ${REWARD_AMOUNT} Pi for watching the ad.`,
        });
        notifyAdRewardEarned(REWARD_AMOUNT);
      } else {
        saveDailyStats(false);
        toast({
          title: "Ad completed",
          description: "Thanks for watching! No reward this time.",
        });
      }

      // Check ad readiness for next time
      setTimeout(checkAdReadiness, 1000);
      
    } catch (error) {
      console.error('Ad watching failed:', error);
      toast({
        title: "Ad failed",
        description: "Unable to display ad. Please try again later.",
        variant: "destructive",
      });
      notifyAdNotAvailable();
      saveDailyStats(false);
    } finally {
      setIsLoading(false);
      setIsWatchingAd(false);
      setRewardProgress(0);
    }
  };

  const grantReward = async () => {
    if (!user) return;

    try {
      await sendA2UPayment(
        user.id,
        REWARD_AMOUNT,
        `Reward for watching ad - Dynamic Wallet View`,
        {
          type: 'ad_reward',
          timestamp: new Date().toISOString(),
          app: 'dynamic-wallet-view'
        }
      );
      console.log('✅ Reward granted successfully');
    } catch (error) {
      console.error('❌ Failed to grant reward:', error);
      // Don't show error to user as the ad was still watched
    }
  };

  const checkAppPaymentCapability = async () => {
    try {
      // For now, assume we can't pay rewards (this would be implemented with app balance checking)
      setCanPayReward({ 
        canPay: false, 
        reason: 'App currently cannot pay rewards. This is normal for development/testing.' 
      });
    } catch (error) {
      console.error('Failed to check app payment capability:', error);
      setCanPayReward({ canPay: false, reason: 'Unable to check payment capability' });
    }
  };

  const canWatchAd = isAdReady && !isLoading && dailyWatches < MAX_DAILY_WATCHES;
  const timeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime() - now.getTime();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            <span>Watch Ads for Pi</span>
          </div>
          <Badge variant="secondary" className="text-xs w-fit">
            {dailyWatches}/{MAX_DAILY_WATCHES} today
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAdReady && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Ads are not currently available. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {dailyWatches >= MAX_DAILY_WATCHES && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              You've reached your daily limit. Come back tomorrow for more rewards!
            </AlertDescription>
          </Alert>
        )}

        {isWatchingAd && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Watching ad...</span>
              <span>{rewardProgress}%</span>
            </div>
            <Progress value={rewardProgress} className="w-full" />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted rounded-lg gap-2">
            <div className="min-w-0 flex-1">
              <div className="font-medium">Reward per ad</div>
              <div className="text-sm text-muted-foreground">Watch a short video</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-lg">{REWARD_AMOUNT} π</div>
              <div className="text-xs text-muted-foreground">Pi Network</div>
            </div>
          </div>

          <Button
            onClick={handleWatchAd}
            disabled={!canWatchAd}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span className="ml-2">
              {isLoading ? 'Loading Ad...' : 'Watch Ad for Pi'}
            </span>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Watch ads to earn Pi rewards</p>
          <p>• Limited to {MAX_DAILY_WATCHES} ads per day</p>
          <p>• Rewards are sent directly to your Pi wallet</p>
          <p>• Ads must be watched completely to earn rewards</p>
        </div>
      </CardContent>
    </Card>
  );
} 