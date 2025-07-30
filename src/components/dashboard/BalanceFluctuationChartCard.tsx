
"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart as RechartsBarChart } from 'recharts';
import { ChartTooltip, ChartTooltipContent, ChartContainer } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockChartData } from '@/data/mocks';
import { format } from 'date-fns';
import { BarChartIcon } from '@/components/shared/icons';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { getBalanceHistory } from '@/services/piService';

type ChartPeriod = '3M' | '6M' | '12M';

export function BalanceFluctuationChartCard() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<ChartPeriod>('6M');

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getBalanceHistory()
      .then(setChartData)
      .catch(() => setError('Failed to load balance history. Please try again.'))
      .finally(() => setIsLoading(false));
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

  if (!chartData.length) return (
    <Card className="shadow-lg flex flex-col items-center justify-center min-h-[120px] p-4 text-center">
      <span className="text-gray-500">No balance history data available.</span>
    </Card>
  );

  const data = mockChartData[period];

  const chartConfig = {
    transferable: {
      label: "Transferable",
      color: "hsl(var(--primary))",
    },
    unverified: {
      label: "Unverified",
      color: "hsl(var(--accent))",
    },
    date: {
      label: "Date",
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
                <CardTitle className="font-headline flex items-center text-lg sm:text-xl">
                    <BarChartIcon className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                    Balance Fluctuation
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                    Track your balance changes over time.
                </CardDescription>
            </div>
            <Tabs defaultValue={period} onValueChange={(value) => setPeriod(value as ChartPeriod)} className="w-auto">
                <TabsList className="h-8 sm:h-10">
                    <TabsTrigger value="3M" className="text-xs sm:text-sm px-2 sm:px-3">3M</TabsTrigger>
                    <TabsTrigger value="6M" className="text-xs sm:text-sm px-2 sm:px-3">6M</TabsTrigger>
                    <TabsTrigger value="12M" className="text-xs sm:text-sm px-2 sm:px-3">12M</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] md:h-[350px] w-full overflow-hidden">
          <RechartsBarChart 
            data={data}
            margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
            barGap={2}
            barCategoryGap="15%"
          >
            <ChartTooltip 
              content={<ChartTooltipContent 
                  formatter={(value, name, item) => {
                    const month = format(new Date(item.payload.date), 'MMM yyyy');
                    return (
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">{month}</span>
                            <span>{value.toLocaleString()} π</span>
                        </div>
                    );
                  }}
              />} 
            />
            <Bar dataKey="transferable" fill="var(--color-transferable)" radius={[4, 4, 0, 0]} name="Transferable" />
            <Bar dataKey="unverified" fill="var(--color-unverified)" radius={[4, 4, 0, 0]} name="Unverified" />
          </RechartsBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
