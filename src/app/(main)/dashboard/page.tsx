
"use client"

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
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
import { mockTeam } from '@/data/mocks';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
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

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(TABS.includes(initialTab as string) ? initialTab as string : 'overview');

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard?tab=${value}`, { scroll: false });
  };

  const handleRedirectToPiApp = () => {
    window.open(PI_APP_MINING_URL, '_blank');
  };

  if (!user) {
    return ( 
      <div className="flex h-full w-full items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  const activeTeamMembers = mockTeam.filter(m => m.status === 'active').length;
  const totalTeamMembers = mockTeam.length;

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      
      {/* KPI Cards Grid - Responsive and Overflow Safe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 auto-rows-fr">
        <KPICard
          title="Total Pi Balance"
          value={(user.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4}) + ' π'}
          icon={<WalletIcon />}
          footerValue={`~$${((user.balance || 0) * 0.042).toFixed(2)} USD`}
          change="+2.3%"
        />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div className="cursor-pointer">
              <KPICard
                title="Current Mining Rate"
                value={`${(user.miningRate || 0).toFixed(4)} π/hr`}
                icon={<GaugeIcon />}
                footerValue="Next session in 12h"
                badgeText="Active"
                badgeVariant="success"
              />
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
          <KPICard
            title="Active Team Members"
            value={`${activeTeamMembers} / ${totalTeamMembers}`}
            icon={<UsersIcon />}
            footerValue={`${totalTeamMembers - activeTeamMembers} inactive`}
          />
        </Link>
        
        {user.isNodeOperator && user.nodeUptimePercentage !== undefined && (
          <Link href="/dashboard/node" className="block">
            <KPICard
              title="Node Uptime (90d)"
              value={`${(user.nodeUptimePercentage || 0).toFixed(1)}%`}
              icon={<ServerIcon />}
              footerValue="Uptime last 90d"
              badgeText="Online"
              badgeVariant="success"
            />
          </Link>
        )}
      </div>

      {/* Tabs Container - Responsive and Overflow Safe */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-full">
        <ScrollArea className="w-full max-w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto min-h-[44px] sm:min-h-[48px] gap-1">
            <TabsTrigger 
              value="overview" 
              className="flex items-center justify-center gap-1 text-xs sm:text-sm px-1 sm:px-2 py-2 min-h-[44px] sm:min-h-[48px]"
            >
              <PieChartIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="portfolio" 
              className="flex items-center justify-center gap-1 text-xs sm:text-sm px-1 sm:px-2 py-2 min-h-[44px] sm:min-h-[48px]"
            >
              <BarChartIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Portfolio</span>
              <span className="sm:hidden">Portfolio</span>
            </TabsTrigger>
            <TabsTrigger 
              value="achievements" 
              className="flex items-center justify-center gap-1 text-xs sm:text-sm px-1 sm:px-2 py-2 min-h-[44px] sm:min-h-[48px]"
            >
              <TrophyIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Achievements</span>
              <span className="sm:hidden">Achievements</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analysis" 
              className="flex items-center justify-center gap-1 text-xs sm:text-sm px-1 sm:px-2 py-2 min-h-[44px] sm:min-h-[48px]"
            >
              <SettingsIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Analysis</span>
              <span className="sm:hidden">Analysis</span>
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Tab Content - Responsive Grid Layouts */}
        <TabsContent value="overview" className="mt-4 sm:mt-6 w-full max-w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full max-w-full">
            <div className="space-y-4 sm:space-y-6 w-full">
              <BalanceBreakdownCard />
              <TeamActivityCard />
            </div>
            <div className="space-y-4 sm:space-y-6 w-full">
              <UnverifiedPiDetailCard />
              <MiningFocusCard />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="portfolio" className="mt-4 sm:mt-6 w-full max-w-full">
          <div className="w-full max-w-full">
            <BalanceFluctuationChartCard />
          </div>
        </TabsContent>
        
        <TabsContent value="achievements" className="mt-4 sm:mt-6 w-full max-w-full">
          <div className="w-full max-w-full">
            <MyBadgesCard />
          </div>
        </TabsContent>
        
        <TabsContent value="analysis" className="mt-4 sm:mt-6 w-full max-w-full">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 w-full max-w-full">
            <div className="w-full">
              <LockupCalculatorCard />
            </div>
            <div className="w-full">
              <AIFeatureFeedbackCard />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
