
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/data/schemas';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { PaymentForm } from '@/components/payment/PaymentForm';
import { RecentSupporters } from '@/components/dashboard/donate/RecentSupporters';
import { MOCK_RECENT_DONATIONS } from '@/data/mocks';

export default function DonatePage() {
  const { user: rawUser } = useAuth();
  const user = rawUser as User | null;
  const [goalTarget, setGoalTarget] = useState<number | null>(null);
  const [currentDonations, setCurrentDonations] = useState<number>(0);
  const [recentSupporters, setRecentSupporters] = useState(MOCK_RECENT_DONATIONS);

  const handlePaymentSuccess = async ({ amount, memo, txid }: { amount: number; memo: string; txid?: string }) => {
    // Update donation statistics
    setCurrentDonations(prev => prev + amount);
    
    // Add to recent supporters
    const newSupporter = {
      name: user?.name || 'Anonymous',
      amount: amount
    };
    setRecentSupporters(prev => [newSupporter, ...prev.slice(0, 4)]);

    // Persist donation record
    try {
      await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount, memo, txid })
      });
    } catch {}
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [goalRes, listRes] = await Promise.all([
          fetch('/api/donations/goals', { credentials: 'include' }),
          fetch('/api/donations', { credentials: 'include' })
        ]);
        if (goalRes.ok) {
          const g = await goalRes.json();
          setGoalTarget(g.goal?.targetAmount ?? 250);
          setCurrentDonations(g.totalAmount ?? 0);
        }
        if (listRes.ok) {
          const d = await listRes.json();
          const supporters = (d.recent || []).map((r: any) => ({ name: r.donorName || 'Anonymous', amount: r.amount }));
          setRecentSupporters(supporters.length ? supporters : MOCK_RECENT_DONATIONS);
        }
      } catch {}
    };
    load();
  }, []);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  const target = goalTarget ?? 250;
  const progressPercentage = (currentDonations / target) * 100;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8 max-w-6xl">
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Support Dynamic Wallet View</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Help us keep this Pi Network dashboard free and improve it with new features. 
            Your support goes directly to server costs and development.
          </p>
        </div>

        {/* Donation Goal Card */}
        <Card className="max-w-2xl mx-auto bg-card/80 backdrop-blur-xl border border-border/60 shadow-lg">
          <CardHeader className="text-center pb-3 sm:pb-4">
            <CardTitle>Monthly Goal</CardTitle>
            <CardDescription>
              Help us reach our monthly server cost goal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {currentDonations.toFixed(2)} / {target} π
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {progressPercentage >= 100 
                ? "🎉 Goal reached! Thank you for your support!" 
                 : `${(target - currentDonations).toFixed(2)} π needed to reach goal`
              }
            </p>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
          {/* Payment Form */}
          <div className="space-y-4 sm:space-y-6">
            <PaymentForm
              title="Make a Donation"
              description="Support the development of Dynamic Wallet View"
              defaultAmount={5}
              presetAmounts={[1, 2.5, 5, 10, 25]}
              onSuccess={handlePaymentSuccess}
            />
          </div>

          {/* Recent Supporters */}
          <div className="space-y-4 sm:space-y-6">
            <RecentSupporters supporters={recentSupporters} />
            
            <Separator />
            
            {/* Why Support Section */}
            <Card className="bg-card/80 backdrop-blur-xl border border-border/60 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Why Support Us?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Server Costs</h4>
                    <p className="text-sm text-muted-foreground">
                      Help cover monthly hosting and infrastructure costs
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">New Features</h4>
                    <p className="text-sm text-muted-foreground">
                      Fund development of new dashboard features and improvements
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Keep It Free</h4>
                    <p className="text-sm text-muted-foreground">
                      Ensure the dashboard remains free for all Pi Network users
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Thank you for supporting the Pi Network community! 💜
          </p>
        </div>
      </div>
    </div>
  );
}
