
"use client"

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getNodeData } from '@/services/piService';
import type { NodeData } from '@/data/schemas';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area } from 'recharts';
import { ChartTooltip, ChartTooltipContent, ChartContainer } from '@/components/ui/chart';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { PI_NODE_INFO_URL } from '@/lib/constants';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { NodeStatusBadge } from '@/components/dashboard/node/NodeStatusBadge';
import { NodeStatCard } from '@/components/dashboard/node/NodeStatCard';
import { 
    ExternalLinkIcon,
    ShieldCheckIcon,
    ZapIcon,
    AwardIcon,
    ServerIcon,
    TrendingUpIcon,
    GaugeIcon,
    GlobeIcon,
    BlocksIcon,
    GitBranchIcon
} from '@/components/shared/icons';


function NodeOperatorView() {
  const [nodeData, setNodeData] = useState<NodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getNodeData();
        setNodeData(data);
      } catch (err) {
        setError("An error occurred fetching node data.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);
  
  if (isLoading) {
    return (
      <div className="w-full max-w-full space-y-4 sm:space-y-6">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 rounded-lg" />)}
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
        </div>
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  if (error || !nodeData) return <p className="text-destructive text-center">{error || "Could not load node data."}</p>;

  const chartConfig = {
    score: {
      label: "Score",
      color: "hsl(var(--primary))",
    },
  };

  const lastSeenText = formatDistanceToNowStrict(parseISO(nodeData.lastSeen), { addSuffix: true });

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <NodeStatCard
                title="Status"
                icon={<ServerIcon />}
                mainContent={<NodeStatusBadge status={nodeData.status}/>}
                footerText={`Last seen: ${lastSeenText}`}
            />
            <NodeStatCard
                title="Location"
                icon={<GlobeIcon />}
                mainContent={<div className="flex items-center gap-2"><span className="text-2xl">{nodeData.countryFlag}</span> <span className="truncate">{nodeData.country}</span></div>}
                footerText="Based on your node's IP address"
            />
            <NodeStatCard
                title="Blocks Processed"
                icon={<BlocksIcon />}
                mainContent={nodeData.blocksProcessed.toLocaleString()}
                footerText="Total blocks synchronized"
            />
             <NodeStatCard
                title="Node Version"
                icon={<GitBranchIcon />}
                mainContent={<span className="truncate">{nodeData.nodeSoftwareVersion}</span>}
                footerText={`Latest: ${nodeData.latestSoftwareVersion}`}
            />
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
            <NodeStatCard
                title="Uptime (90d)"
                icon={<GaugeIcon />}
                mainContent={`${nodeData.uptimePercentage.toFixed(2)}%`}
                footerText="Excellent stability"
            />
            <NodeStatCard
                title="Performance Score"
                icon={<TrendingUpIcon />}
                mainContent={nodeData.performanceScore.toString()}
                footerText="Compared to network average"
            />
        </div>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 w-full max-w-full">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl break-words">Performance History</CardTitle>
          <CardDescription className="text-sm sm:text-base break-words">Your node's performance score trend over the last few months.</CardDescription>
        </CardHeader>
        <CardContent className="w-full max-w-full">
          <ChartContainer config={chartConfig} className="h-[300px] w-full max-w-full">
            <AreaChart data={nodeData.performanceHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
               <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-score)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-score)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <ChartTooltip cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '3 3' }} content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="score" stroke="var(--color-score)" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function BecomeANodeOperatorPrompt() {
  return (
    <div className="flex items-center justify-center py-8 sm:py-12 w-full max-w-full">
        <Card className="shadow-lg text-center w-full max-w-sm sm:max-w-2xl mx-auto">
        <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10">
            <ServerIcon className="h-6 w-6 sm:h-8 sm:w-8"/>
            </div>
            <CardTitle className="font-headline text-xl sm:text-2xl break-words">Become a Node Operator</CardTitle>
            <CardDescription className="text-sm sm:text-base break-words">Help secure the Pi Network and earn rewards by running a node on your computer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 w-full">
            <div className="text-left space-y-3 sm:space-y-4 w-full">
                <h3 className="font-semibold text-center text-sm sm:text-base break-words">Why Run a Node?</h3>
                <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-green-500/10 mt-1 shrink-0">
                        <ShieldCheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm sm:text-base break-words">Strengthen the Network</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground break-words">Each node contributes to the decentralization and security of the Pi blockchain.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-yellow-500/10 mt-1 shrink-0">
                        <AwardIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm sm:text-base break-words">Earn Pi Rewards</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground break-words">Receive additional Pi for your contribution to the network's operation.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-blue-500/10 mt-1 shrink-0">
                        <ZapIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm sm:text-base break-words">Prepare for Mainnet</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground break-words">Play a crucial role in validating transactions when the Open Network period begins.</p>
                    </div>
                </div>
            </div>
        </CardContent>
        <CardFooter className="flex-col gap-4 w-full">
            <Button asChild size="lg" className="w-full sm:w-auto text-xs sm:text-sm min-h-[44px] sm:min-h-[40px]">
            <a href={PI_NODE_INFO_URL} target="_blank" rel="noopener noreferrer">
                Learn More on Pi Network
                <ExternalLinkIcon className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </a>
            </Button>
            <p className="text-xs text-muted-foreground break-words">Node software runs on desktop or laptop computers.</p>
        </CardFooter>
        </Card>
    </div>
  );
}


export default function NodeAnalysisPage() {
  const { user } = useAuth();

  if (!user) return <div className="flex h-full w-full items-center justify-center"><LoadingSpinner size={32} /></div>;

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-headline break-words">Node Analysis</h1>
      {user.isNodeOperator ? <NodeOperatorView /> : <BecomeANodeOperatorPrompt />}
    </div>
  );
}
