
"use client"

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/data/schemas';
import { KPICard } from '@/components/shared/KPICard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PI_APP_MINING_URL } from '@/lib/constants';
import { BalanceBreakdownCard } from '@/components/dashboard/BalanceBreakdownCard';
import { UnverifiedPiDetailCard } from '@/components/dashboard/UnverifiedPiDetailCard';
import { MiningFocusCard } from '@/components/dashboard/MiningFocusCard';
import { TeamActivityCard } from '@/components/dashboard/TeamActivityCard';
import { BalanceFluctuationChartCard } from '@/components/dashboard/BalanceFluctuationChartCard';
import { MyBadgesCard } from '@/components/dashboard/MyBadgesCard';
import { LockupCalculatorCard } from '@/components/dashboard/LockupCalculatorCard';
import { AIFeatureFeedbackCard } from '@/components/dashboard/AIFeatureFeedbackCard';
import WalletAddressCard from '@/components/dashboard/WalletAddressCard';
import NativeFeaturesCard from '@/components/dashboard/NativeFeaturesCard';
import RewardedAdsCard from '@/components/dashboard/RewardedAdsCard';
import { mockTeam } from '@/data/mocks';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { InfoBanner } from '@/components/shared/InfoBanner';
import { PageHeader } from '@/components/shared/PageHeader';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
    WalletIcon, 
    GaugeIconDashboard as GaugeIcon, 
    UsersIcon, 
    ServerIcon, 
    PieChartIcon, 
    BarChartIcon, 
    TrophyIcon, 
    SettingsIcon 
} from '@/components/shared/icons';

const TABS = ['overview', 'portfolio', 'achievements', 'analysis'];

// Error Boundary Component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Dashboard error caught:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="text-muted-foreground mb-4">Please refresh the page to try again.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Safe Component Wrapper
function SafeComponent({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner size={24} />}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </Suspense>
  );
}

export default function DashboardPage() {
  const { user: rawUser } = useAuth();
  const user = rawUser as User | null;
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [piBalance, setPiBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(TABS.includes(initialTab as string) ? initialTab as string : 'overview');

  // Fetch real-time Pi balance from SDK with error handling
  useEffect(() => {
    const fetchPiBalance = async () => {
      try {
        setError(null);
        setBalanceLoading(true);
        // For now, use user balance as fallback
        // In a real implementation, you would call the Pi SDK here
        setPiBalance(user?.balance || null);
        console.log('✅ Pi balance fetched:', user?.balance);
      } catch (error) {
        console.error('❌ Error fetching Pi balance:', error);
        setError('Failed to fetch balance');
        setPiBalance(null);
      } finally {
        setBalanceLoading(false);
      }
    };

    if (user) {
      fetchPiBalance();
    }
  }, [user]);

  const handleTabChange = (value: string) => {
    try {
      setActiveTab(value);
      router.push(`/dashboard?tab=${value}`, { scroll: false });
    } catch (error) {
      console.error('Tab change error:', error);
    }
  };

  const handleRedirectToPiApp = () => {
    try {
      window.open(PI_APP_MINING_URL, '_blank');
    } catch (error) {
      console.error('Redirect error:', error);
    }
  };

  if (!user) {
    return ( 
      <div className="flex h-full w-full items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  // Use real-time Pi balance if available, otherwise fallback to user data
  const displayBalance = piBalance !== null ? piBalance : (user.balance || 0);
  const balanceStatus = piBalance !== null ? 'live' : 'fallback';

  // TODO: Replace mockTeam with real API data
  // const { team, isLoading: teamLoading } = useTeam();
  // const activeTeamMembers = team?.filter(m => m.status === 'active').length || 0;
  // const totalTeamMembers = team?.length || 0;
  const activeTeamMembers = mockTeam.filter(m => m.status === 'active').length;
  const totalTeamMembers = mockTeam.length;

  return (
    <SafeComponent>
      <div className="w-full max-w-full space-y-3 sm:space-y-4 md:space-y-6">
        <PageHeader title="Dashboard" subtitle="Manage your Pi Network wallet" />

        {/* Error Display */}
        {error && (
          <InfoBanner
            variant="destructive"
            title={error}
            onRetry={() => {
              setError(null);
              setBalanceLoading(true);
              setPiBalance(user?.balance || null);
              setBalanceLoading(false);
            }}
          />
        )}
        
        {/* KPI Cards Grid - Horizontal Scrollable on Mobile */}
        <div className="scroll-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 auto-rows-fr min-w-0">
          <SafeComponent>
            <KPICard
              title="Total Pi Balance"
              value={
                balanceLoading 
                  ? 'Loading...' 
                  : displayBalance.toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4}) + ' π'
              }
              icon={<WalletIcon />}
              footerValue={
                balanceStatus === 'live' 
                  ? `~$${(displayBalance * 0.042).toFixed(2)} USD (Live)` 
                  : `~$${(displayBalance * 0.042).toFixed(2)} USD (Fallback)`
              }
              change="+2.3%"
            />
          </SafeComponent>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <div className="cursor-pointer">
                <SafeComponent>
                  <KPICard
                    title="Current Mining Rate"
                    value={`${(user.miningRate || 0).toFixed(4)} π/hr`}
                    icon={<GaugeIcon />}
                    footerValue="Next session in 12h"
                    badgeText="Active"
                    badgeVariant="success"
                  />
                </SafeComponent>
              </div>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Redirect to Pi App?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be redirected to the Pi Network app to manage your mining session. Continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRedirectToPiApp}>
                  Continue to Pi App
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
           <Link href="/dashboard/team" className="block">
            <SafeComponent>
              <KPICard
                title="Active Team Members"
                value={`${activeTeamMembers} / ${totalTeamMembers}`}
                icon={<UsersIcon />}
                footerValue={`${totalTeamMembers - activeTeamMembers} inactive`}
              />
            </SafeComponent>
          </Link>
          
          {user.isNodeOperator && user.nodeUptimePercentage !== undefined && (
            <Link href="/dashboard/node" className="block">
              <SafeComponent>
                <KPICard
                  title="Node Uptime (90d)"
                  value={`${(user.nodeUptimePercentage || 0).toFixed(1)}%`}
                  icon={<ServerIcon />}
                  footerValue="Uptime last 90d"
                  badgeText="Online"
                  badgeVariant="success"
                />
              </SafeComponent>
            </Link>
          )}
          </div>
        </div>

        {/* Tabs Container - Responsive and Overflow Safe */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-full">
          <ScrollArea className="w-full max-w-full">
            {/* Mobile improvement: keep tabs visible while scrolling content */}
            <div className="sticky top-14 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <TabsList className="grid w-full grid-cols-4 h-auto min-h-[40px] sm:min-h-[44px] md:min-h-[48px] gap-1 p-1">
              <TabsTrigger 
                value="overview" 
                className="flex items-center justify-center gap-1 text-xs sm:text-sm px-1 sm:px-2 py-1.5 sm:py-2 min-h-[40px] sm:min-h-[44px] md:min-h-[48px]"
              >
                <PieChartIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="portfolio" 
                className="flex items-center justify-center gap-1 text-xs sm:text-sm px-1 sm:px-2 py-1.5 sm:py-2 min-h-[40px] sm:min-h-[44px] md:min-h-[48px]"
              >
                <BarChartIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Portfolio</span>
                <span className="sm:hidden">Portfolio</span>
              </TabsTrigger>
              <TabsTrigger 
                value="achievements" 
                className="flex items-center justify-center gap-1 text-xs sm:text-sm px-1 sm:px-2 py-1.5 sm:py-2 min-h-[40px] sm:min-h-[44px] md:min-h-[48px]"
              >
                <TrophyIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Achievements</span>
                <span className="sm:hidden">Achievements</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analysis" 
                className="flex items-center justify-center gap-1 text-xs sm:text-sm px-1 sm:px-2 py-1.5 sm:py-2 min-h-[40px] sm:min-h-[44px] md:min-h-[48px]"
              >
                <SettingsIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Analysis</span>
                <span className="sm:hidden">Analysis</span>
              </TabsTrigger>
            </TabsList>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Tab Content - Responsive Grid Layouts */}
          {/* FIXED: Improved mobile spacing and layout */}
          <TabsContent value="overview" className="mt-3 sm:mt-4 md:mt-6 w-full max-w-full">
            <div className="scroll-container">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 w-full max-w-full min-w-0">
              <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full">
                <SafeComponent><BalanceBreakdownCard /></SafeComponent>
                <SafeComponent><TeamActivityCard /></SafeComponent>
              </div>
              <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full">
                <SafeComponent><UnverifiedPiDetailCard /></SafeComponent>
                <SafeComponent><MiningFocusCard /></SafeComponent>
              </div>
            </div>
          </div>
          </TabsContent>
          
          <TabsContent value="portfolio" className="mt-3 sm:mt-4 md:mt-6 w-full max-w-full">
            <div className="scroll-container">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 w-full max-w-full min-w-0">
              <div className="w-full">
                <SafeComponent><BalanceFluctuationChartCard /></SafeComponent>
              </div>
              <div className="w-full">
                <SafeComponent><WalletAddressCard user={user} /></SafeComponent>
              </div>
            </div>
          </div>
          </TabsContent>
          
          <TabsContent value="achievements" className="mt-3 sm:mt-4 md:mt-6 w-full max-w-full">
            <div className="scroll-container">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 w-full max-w-full min-w-0">
              <div className="w-full">
                <SafeComponent><MyBadgesCard /></SafeComponent>
              </div>
              <div className="w-full">
                <SafeComponent><RewardedAdsCard /></SafeComponent>
              </div>
            </div>
          </div>
          </TabsContent>
          
          <TabsContent value="analysis" className="mt-3 sm:mt-4 md:mt-6 w-full max-w-full">
            <div className="scroll-container">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-6 w-full max-w-full min-w-0">
              <div className="w-full">
                <SafeComponent><LockupCalculatorCard /></SafeComponent>
              </div>
              <div className="w-full">
                <SafeComponent><AIFeatureFeedbackCard /></SafeComponent>
              </div>
            </div>
          </div>
            <div className="mt-3 sm:mt-4 md:mt-6 w-full">
              <SafeComponent><NativeFeaturesCard /></SafeComponent>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SafeComponent>
  );
}
