
"use client"

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { getTransactions } from '@/services/piService';
import type { Transaction } from '@/data/schemas';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SortableTableHead } from '@/components/shared/SortableTableHead';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
    ArrowDownLeftIcon,
    ArrowUpRightIcon,
    AwardIcon,
    ServerIcon,
    CheckCircleIcon,
    ClockIcon,
    ZapIcon,
    CoinsIcon,
    ExternalLinkIconSmall as ExternalLinkIcon
} from '@/components/shared/icons';

type SortableKeys = 'date' | 'type' | 'amount' | 'status' | 'description';

const transactionTypeConfig = {
    sent: { icon: ArrowUpRightIcon, colorClass: 'text-red-500', label: "Sent" },
    received: { icon: ArrowDownLeftIcon, colorClass: 'text-green-500', label: "Received" },
    mining_reward: { icon: AwardIcon, colorClass: 'text-yellow-500', label: "Mining Reward" },
    node_bonus: { icon: ServerIcon, colorClass: 'text-blue-500', label: "Node Bonus" }
}

const statusConfig = {
    completed: { variant: 'success' as const, icon: CheckCircleIcon, text: "Completed" },
    pending: { variant: 'warning' as const, icon: ClockIcon, text: "Pending" },
    failed: { variant: 'destructive' as const, icon: ZapIcon, text: "Failed" }
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const typeInfo = transactionTypeConfig[tx.type];
  const TypeIcon = typeInfo.icon;
  const statusInfo = statusConfig[tx.status];
  const StatusIcon = statusInfo.icon;

  const handleExplorerRedirect = () => {
    // In a real app, this would use the tx.blockExplorerUrl
    console.log(`Redirecting to block explorer for tx: ${tx.id}`);
  };

  return (
    <TableRow>
      <TableCell className="hidden sm:table-cell min-w-[60px]">
        <AlertDialog>
          <TooltipProvider>
              <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                        <div className={cn("flex items-center justify-center h-8 w-8 rounded-full cursor-pointer bg-muted")}>
                            <TypeIcon className="h-4 w-4" />
                        </div>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>View on Block Explorer</p>
                  </TooltipContent>
              </Tooltip>
          </TooltipProvider>
          <AlertDialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>View on Pi Block Explorer?</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to be redirected to an external block explorer to view the details of this transaction. Do you want to continue?
                <br /><br />
                <span className="text-xs text-muted-foreground break-all">Transaction ID: {tx.id}</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleExplorerRedirect} className="min-h-[44px] sm:min-h-[40px]">
                <ExternalLinkIcon className="mr-2 h-4 w-4" />
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
      <TableCell className="min-w-[200px]">
        <div className="font-medium break-words">{tx.description}</div>
        <div className="text-xs text-muted-foreground truncate hidden md:block">{tx.from || tx.to || 'Network'}</div>
      </TableCell>
      <TableCell className="text-right min-w-[120px]">
        <span className={cn("font-mono text-sm", {
          'text-red-600 dark:text-red-400': tx.type === 'sent',
          'text-green-600 dark:text-green-400': tx.type === 'received',
          'text-foreground': tx.type !== 'sent' && tx.type !== 'received'
        })}>
            {tx.type === 'sent' ? '-' : '+'}{tx.amount.toFixed(4)} π
        </span>
      </TableCell>
      <TableCell className="hidden md:table-cell min-w-[120px]">
        <Badge variant={statusInfo.variant} className="gap-1.5">
            <StatusIcon className="h-3.5 w-3.5" />
            {statusInfo.text}
        </Badge>
      </TableCell>
      <TableCell className="text-right text-muted-foreground hidden sm:table-cell min-w-[120px]">
        {format(new Date(tx.date), 'MMM dd, yyyy')}
      </TableCell>
    </TableRow>
  );
}


function TransactionsTableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-md" />
      ))}
    </div>
  );
}


export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<React.SortConfig<Transaction>>({ key: 'date', direction: 'descending' });
  const { dataVersion } = useAuth(); // Listen to data changes

  useEffect(() => {
    async function fetchTransactions() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getTransactions();
        setTransactions(data);
      } catch (err) {
        setError("Failed to load transactions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTransactions();
  }, [dataVersion]); // Re-fetch when dataVersion changes

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedTransactions = useMemo(() => {
    const sortableItems = [...transactions];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key as keyof Transaction];
        const valB = b[sortConfig.key as keyof Transaction];
        
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
  }, [transactions, sortConfig]);

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-headline break-words">Transaction History</h1>
      <Card className="shadow-lg w-full max-w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <CoinsIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            Your Ledger
          </CardTitle>
          <CardDescription className="break-words">
            A complete history of all your transactions on the Pi Network.
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full max-w-full">
          {isLoading && <TransactionsTableSkeleton />}
          {!isLoading && error && <p className="text-destructive text-center py-8">{error}</p>}
          {!isLoading && !error && sortedTransactions.length === 0 && (
            <p className="text-muted-foreground text-center py-8">You have no transactions yet.</p>
          )}
          {!isLoading && !error && sortedTransactions.length > 0 && (
             <div className="border rounded-md w-full max-w-full overflow-hidden">
                <ScrollArea className="w-full max-w-full">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableCell className="w-16 hidden sm:table-cell min-w-[60px]">Type</TableCell>
                              <SortableTableHead sortKey="description" sortConfig={sortConfig} onClick={() => requestSort('description')} className="min-w-[200px]">
                                  Details
                              </SortableTableHead>
                              <SortableTableHead sortKey="amount" sortConfig={sortConfig} onClick={() => requestSort('amount')} isNumeric className="min-w-[120px]">
                                  Amount
                              </SortableTableHead>
                              <SortableTableHead sortKey="status" sortConfig={sortConfig} onClick={() => requestSort('status')} className="hidden md:table-cell min-w-[120px]">
                                  Status
                              </SortableTableHead>
                              <SortableTableHead sortKey="date" sortConfig={sortConfig} onClick={() => requestSort('date')} isNumeric className="hidden sm:table-cell min-w-[120px]">
                                  Date
                              </SortableTableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {sortedTransactions.map((tx) => (
                              <TransactionRow key={tx.id} tx={tx} />
                          ))}
                      </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
