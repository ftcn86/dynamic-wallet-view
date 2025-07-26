
"use client"

import React, { useEffect, useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getTeamMembers, sendBroadcastNotification, addNotification } from '@/services/piService';
import type { TeamMember } from '@/data/schemas';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { KycStatusBadge } from '@/components/shared/KycStatusBadge'; 
import { Badge as UiBadge } from '@/components/ui/badge';
import { SortableTableHead } from '@/components/shared/SortableTableHead';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
    UsersIcon, 
    BellIconAccent as BellIcon, 
    MessageSquareIconAccent as MessageSquareIcon, 
    SendIcon, 
    InfoIcon 
} from '@/components/shared/icons';
import { useAuth } from '@/contexts/AuthContext';

function TeamManagementCard({ teamMembers }: { teamMembers: TeamMember[] }) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [broadcastMessage, setBroadcastMessage] = useState("");
    const [isPinging, setIsPinging] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    const inactiveMembersCount = useMemo(() => teamMembers.filter(m => m.status === 'inactive').length, [teamMembers]);

    const handlePingInactive = () => {
        setIsPinging(true);
        setTimeout(() => {
            toast({
                title: t('teamInsights.pingSuccessTitle'),
                description: t('teamInsights.pingSuccessDesc', { count: inactiveMembersCount }),
            });
            setIsPinging(false);
        }, 1000);
    };

    const handleBroadcast = async () => {
        if (!broadcastMessage.trim()) {
            toast({ title: t('teamInsights.broadcastEmptyTitle'), variant: "destructive" });
            return;
        }
        setIsBroadcasting(true);
        try {
            // Send broadcast and create notification
            const result = await sendBroadcastNotification(broadcastMessage);
            
            if (result.success) {
                // Also create a notification for the current user
                await addNotification({
                    type: 'team_message',
                    title: 'Message from your Team Leader',
                    description: broadcastMessage,
                    link: '/dashboard/team'
                });
                
                toast({
                    title: t('teamInsights.broadcastSuccessTitle'),
                    description: t('teamInsights.broadcastSuccessDesc'),
                });
                setBroadcastMessage("");
            } else {
                throw new Error('Failed to send broadcast');
            }
        } catch (error) {
             toast({
                title: t('teamInsights.broadcastErrorTitle'),
                description: t('teamInsights.broadcastErrorDesc'),
                variant: 'destructive'
            });
        } finally {
            setIsBroadcasting(false);
        }
    };

    return (
        <Card className="shadow-lg w-full max-w-full">
            <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl break-words">
                <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 flex-shrink-0"/> 
                {t('teamInsights.managementTools.title')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm lg:text-base break-words">
                {t('teamInsights.managementTools.description')}
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 w-full max-w-full">
                <div className="flex flex-col space-y-4 rounded-lg border p-3 sm:p-4 w-full min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                        <BellIcon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 flex-shrink-0"/>
                        <h3 className="text-xs sm:text-sm lg:text-base break-words min-w-0">{t('teamInsights.managementTools.pingInactive.title')}</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground flex-grow break-words min-w-0">
                        {t('teamInsights.managementTools.pingInactive.description', {count: inactiveMembersCount})}
                    </p>
                    <Button onClick={handlePingInactive} disabled={isPinging || inactiveMembersCount === 0} className="text-xs sm:text-sm min-h-[44px] sm:min-h-[40px] w-full">
                        {isPinging ? <LoadingSpinner className="mr-2 h-3 w-3 sm:h-4 sm:w-4"/> : <BellIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4"/>}
                        {isPinging ? t('teamInsights.managementTools.pingInactive.buttonPinging') : t('teamInsights.managementTools.pingInactive.button', {count: inactiveMembersCount})}
                    </Button>
                </div>
                <div className="flex flex-col space-y-4 rounded-lg border p-3 sm:p-4 w-full min-w-0">
                     <div className="flex items-center gap-2 font-medium">
                        <MessageSquareIcon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 flex-shrink-0"/>
                        <h3 className="text-xs sm:text-sm lg:text-base break-words min-w-0">{t('teamInsights.managementTools.broadcast.title')}</h3>
                    </div>
                    <Textarea 
                        placeholder={t('teamInsights.managementTools.broadcast.placeholder')}
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        className="flex-grow text-xs sm:text-sm min-h-[80px] w-full"
                        disabled={isBroadcasting}
                    />
                    <Button onClick={handleBroadcast} disabled={isBroadcasting || !broadcastMessage.trim()} className="text-xs sm:text-sm min-h-[44px] sm:min-h-[40px] w-full">
                       {isBroadcasting ? <LoadingSpinner className="mr-2 h-3 w-3 sm:h-4 sm:w-4"/> : <SendIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4"/>}
                       {isBroadcasting ? t('teamInsights.managementTools.broadcast.buttonSending') : t('teamInsights.managementTools.broadcast.button')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

const statusVariantMap = {
  active: 'success',
  pending: 'warning',
  inactive: 'secondary',
} as const;

function TeamMemberRow({ member }: { member: TeamMember }) {
  const { t } = useTranslation();
  const avatarFallback = member.name ? member.name.charAt(0).toUpperCase() : '?';
  return (
    <TableRow>
      <TableCell className="min-w-[150px] sm:min-w-[200px]">
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 md:h-9 md:w-9 flex-shrink-0">
            <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.dataAiHint} />
            <AvatarFallback className="text-xs sm:text-sm">{avatarFallback}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-xs sm:text-sm md:text-base truncate">{member.name}</span>
        </div>
      </TableCell>
      <TableCell className="hidden xl:table-cell text-sm min-w-[120px]">{format(new Date(member.joinDate), 'MMM dd, yyyy')}</TableCell>
      <TableCell className="text-right min-w-[100px] sm:min-w-[120px]">
        <div className="flex items-center justify-end gap-1 font-mono">
          <span className="text-xs sm:text-sm">{member.unverifiedPiContribution.toFixed(2)} π</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-3 w-3 sm:h-4 sm:w-4 cursor-help flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('teamInsights.contributionTooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
      <TableCell className="min-w-[80px] sm:min-w-[100px]">
        <KycStatusBadge status={member.kycStatus} />
      </TableCell>
    </TableRow>
  );
}

function TeamMembersTableSkeleton() {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell className="hidden xl:table-cell">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function TeamInsightsPage() {
  const { t } = useTranslation();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<React.SortConfig<TeamMember>>({ key: 'name', direction: 'ascending' });
  const { dataVersion } = useAuth(); // Listen to data changes

  useEffect(() => {
    async function fetchTeamMembers() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getTeamMembers();
        setTeamMembers(data);
      } catch (err) {
        setError("Failed to load team members. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTeamMembers();
  }, [dataVersion]); // Re-fetch when dataVersion changes

  const requestSort = (key: keyof TeamMember) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedTeamMembers = useMemo(() => {
    const sortableItems = [...teamMembers];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key as keyof TeamMember];
        const valB = b[sortConfig.key as keyof TeamMember];
        
        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else {
          const strA = String(valA ?? ''); 
          const strB = String(valB ?? '');
          comparison = strA.localeCompare(strB);
        }
        
        return sortConfig.direction === 'ascending' ? comparison : comparison * -1;
      });
    }
    return sortableItems;
  }, [teamMembers, sortConfig]);

  if (error) {
    return (
      <div className="w-full max-w-full space-y-4 sm:space-y-6 overflow-hidden">
        <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold font-headline break-words">
          {t('teamInsights.title')}
        </h1>
        <Card className="shadow-lg w-full max-w-full">
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <p>{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold font-headline break-words">
        {t('teamInsights.title')}
      </h1>
      
      <TeamManagementCard teamMembers={teamMembers} />
      
      <Card className="shadow-lg w-full max-w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl break-words">
            <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 flex-shrink-0"/>
            {t('teamInsights.teamMembers.title')}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm lg:text-base break-words">
            {t('teamInsights.teamMembers.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full max-w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    sortKey="name"
                    sortConfig={sortConfig}
                    onClick={() => requestSort('name')}
                    className="min-w-[150px] sm:min-w-[200px]"
                  >
                    {t('teamInsights.teamMembers.columns.name')}
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="joinDate"
                    sortConfig={sortConfig}
                    onClick={() => requestSort('joinDate')}
                    className="hidden xl:table-cell min-w-[120px]"
                  >
                    {t('teamInsights.teamMembers.columns.joinDate')}
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="unverifiedPiContribution"
                    sortConfig={sortConfig}
                    onClick={() => requestSort('unverifiedPiContribution')}
                    isNumeric={true}
                    className="min-w-[100px] sm:min-w-[120px]"
                  >
                    {t('teamInsights.teamMembers.columns.contribution')}
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="kycStatus"
                    sortConfig={sortConfig}
                    onClick={() => requestSort('kycStatus')}
                    className="min-w-[80px] sm:min-w-[100px]"
                  >
                    {t('teamInsights.teamMembers.columns.kycStatus')}
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TeamMembersTableSkeleton />
                ) : sortedTeamMembers.length > 0 ? (
                  sortedTeamMembers.map((member) => (
                    <TeamMemberRow key={member.id} member={member} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {t('teamInsights.teamMembers.empty')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
