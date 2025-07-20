
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { getPiSDKInstance } from '@/lib/pi-network';
import { SendIcon, HeartIcon, UsersIcon, TrendingUpIcon, AlertTriangleIcon } from '@/components/shared/icons';
import { RecentSupporters } from '@/components/dashboard/donate/RecentSupporters';
import { 
  addTransaction, 
  addNotification
} from '@/services/piService';
import type { PiPayment } from '@/lib/pi-network';

export default function DonatePage() {
  const { user, refreshData } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isDonating, setIsDonating] = useState(false);
  const [currentDonations, setCurrentDonations] = useState(0);
  const [recentSupporters, setRecentSupporters] = useState<Array<{ name: string; amount: number }>>([
    { name: "Pi Pioneer", amount: 5.0 },
    { name: "Crypto Enthusiast", amount: 2.5 },
    { name: "Blockchain Developer", amount: 10.0 },
    { name: "Pi Miner", amount: 1.0 },
    { name: "Community Member", amount: 3.0 },
  ]);

  const presetAmounts = [1, 2.5, 5, 10, 25];

  const handlePresetAmount = (presetAmount: number) => {
    setAmount(presetAmount.toString());
  };

  const handleDonate = async () => {
    if (!user) return;
    setIsDonating(true);
    
    try {
        const donationAmount = parseFloat(amount);
        if (isNaN(donationAmount) || donationAmount <= 0) {
            toast({ title: "Invalid amount", variant: "destructive" });
            return;
        }

        let transactionDescription = "Donation to Dynamic Wallet View";
        if (message.trim()) {
            transactionDescription = message.trim();
        }

        // Create Pi Network payment
        const paymentData = {
            amount: donationAmount,
            memo: transactionDescription,
            metadata: {
                type: 'donation',
                app: 'dynamic-wallet-view',
                user_id: user.id,
                message: message.trim() || undefined,
            },
        };

        // Check if Pi SDK is available
        const isSDKAvailable = typeof window !== 'undefined' && 
          (window as any).Pi && 
          (window as any).Pi.authenticate && 
          typeof (window as any).Pi.authenticate === 'function';

        if (isSDKAvailable) {
            // Real Pi Network payment flow
            console.log('🔍 Pi SDK available - using real Pi Network payments');
            
            // Check if user is authenticated, if not authenticate them
            const sdk = getPiSDKInstance();
            if (!sdk.isAuthenticated()) {
                console.log('🔍 User not authenticated, authenticating...');
                await sdk.authenticate(['username', 'payments']);
            }
            
            const payment = await (window as any).Pi.createPayment(paymentData, {
                onReadyForServerApproval: async (paymentId: string) => {
                    console.log('Donation ready for approval:', paymentId);
                    
                    // Call server API to approve the payment
                    try {
                        const response = await fetch('/api/payments', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${user.accessToken || 'mock-token'}`,
                            },
                            body: JSON.stringify({
                                action: 'approve',  // ✅ CORRECT: approve first
                                paymentId: paymentId,  // ✅ CORRECT: send paymentId
                            }),
                        });

                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error('Server response error:', response.status, errorText);
                            throw new Error(`Failed to approve payment on server: ${response.status} ${errorText}`);
                        }

                        const result = await response.json();
                        console.log('Payment approved on server:', paymentId, result);
                        
                        // ✅ CORRECT: Call payment.approve() after server approval
                        payment.approve(paymentId);
                    } catch (error) {
                        console.error('Server approval failed:', error);
                        // Cancel the payment if server approval fails
                        payment.cancel(paymentId);
                        throw error;
                    }
                },
                onReadyForServerCompletion: async (paymentId: string, txid: string) => {
                    console.log('Donation ready for completion:', paymentId, txid);
                    
                    // Call server API to complete the payment
                    try {
                        const response = await fetch('/api/payments', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${user.accessToken || 'mock-token'}`,
                            },
                            body: JSON.stringify({
                                action: 'complete',  // ✅ CORRECT: complete second
                                paymentId: paymentId,
                                txid: txid,
                            }),
                        });

                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error('Server completion error:', response.status, errorText);
                            
                            // Try to parse error details
                            let errorDetails = '';
                            try {
                                const errorJson = JSON.parse(errorText);
                                errorDetails = errorJson.details || errorJson.error || errorText;
                            } catch {
                                errorDetails = errorText;
                            }
                            
                            throw new Error(`Server completion failed: ${errorDetails}`);
                        }

                        const result = await response.json();
                        console.log('Payment completed on server:', paymentId, result);
                        
                        // ✅ CORRECT: Call payment.complete() after server completion
                        payment.complete(paymentId, txid);
                        
                        // Add transaction to our app's history
                        addTransaction({
                            type: 'sent',
                            amount: donationAmount,
                            status: 'completed',
                            to: 'Dynamic Wallet View Project',
                            description: transactionDescription
                        });

                        // Add notification
                        addNotification({
                            type: 'announcement',
                            title: "Thank you for your support!",
                            description: `Your donation of ${donationAmount}π has been processed successfully.`,
                            link: '/dashboard/transactions'
                        });

                        toast({
                            title: "Thank you for your support!",
                            description: `Your donation of ${donationAmount} π has been processed successfully.`,
                        });
                    } catch (error) {
                        console.error('Server completion failed:', error);
                        
                        // Since the payment is successful on blockchain, we should still show success
                        // The server completion failure doesn't affect the actual transaction
                        console.log('⚠️ Server completion failed, but payment is successful on blockchain');
                        
                        // Still add transaction to our app's history since it was successful
                        addTransaction({
                            type: 'sent',
                            amount: donationAmount,
                            status: 'completed',
                            to: 'Dynamic Wallet View Project',
                            description: transactionDescription
                        });

                        // Add notification
                        addNotification({
                            type: 'announcement',
                            title: "Thank you for your support!",
                            description: `Your donation of ${donationAmount}π has been processed successfully.`,
                            link: '/dashboard/transactions'
                        });

                        toast({
                            title: "Thank you for your support!",
                            description: `Your donation of ${donationAmount} π has been processed successfully. (Note: Transaction completed on blockchain)`,
                        });
                    }
                },
                onCancel: (paymentId: string) => {
                    console.log('Donation cancelled:', paymentId);
                    toast({
                        title: "Donation Cancelled",
                        description: "Your donation was cancelled.",
                        variant: "destructive",
                    });
                },
                onError: (error: Error, payment: any) => {
                    console.error('Donation error:', error);
                    toast({
                        title: "Donation Failed",
                        description: error.message,
                        variant: "destructive",
                    });
                },
            });
        } else {
            // Mock payment flow for development (Pi SDK not available)
            console.log('🔍 Pi SDK not available - using mock payment flow');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await addTransaction({
                type: 'sent',
                amount: donationAmount,
                status: 'completed',
                to: 'Dynamic Wallet View Project',
                description: transactionDescription
            });

            await addNotification({
                type: 'announcement',
                title: "Thank you for your support!",
                description: `Your donation of ${donationAmount}π has been recorded.`,
                link: '/dashboard/transactions'
            });

            toast({
                title: "Thank you for your support!",
                description: `Your donation of ${donationAmount} π has been recorded.`,
            });
        }

        const newTotal = currentDonations + donationAmount;
        setCurrentDonations(newTotal);

        const newSupporter = { name: user.name, amount: donationAmount };
        setRecentSupporters(prev => [newSupporter, ...prev.slice(0, 9)]);

        refreshData();
        setMessage("");

    } catch (error) {
        console.error('Donation error:', error);
        toast({
            title: "Donation Failed",
            description: error instanceof Error ? error.message : "There was an issue processing your donation. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsDonating(false);
    }
  };

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <div className="text-center space-y-2 w-full max-w-full">
        <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold break-words">Support Dynamic Wallet View</h1>
        <p className="text-muted-foreground text-sm sm:text-base break-words">
          Help us continue building amazing tools for the Pi Network community
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full max-w-full">
        {/* Donation Form */}
        <Card className="w-full max-w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl break-words">
              <HeartIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 flex-shrink-0" />
              Make a Donation
            </CardTitle>
            <CardDescription className="text-sm sm:text-base break-words">
              Your support helps us maintain and improve Dynamic Wallet View for the entire Pi Network community.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 w-full">

            
            <div className="space-y-2 w-full">
              <label htmlFor="amount" className="text-sm font-medium">Amount (π)</label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.1"
                step="0.1"
                className="text-sm sm:text-base min-h-[44px] sm:min-h-[40px]"
              />
            </div>

            <div className="space-y-2 w-full">
              <label className="text-sm font-medium">Quick Amounts</label>
              <div className="flex flex-wrap gap-2">
                {presetAmounts.map((presetAmount) => (
                  <Button
                    key={presetAmount}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetAmount(presetAmount)}
                    className="text-xs sm:text-sm min-h-[44px] sm:min-h-[40px]"
                  >
                    {presetAmount} π
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2 w-full">
              <label htmlFor="message" className="text-sm font-medium">Message (Optional)</label>
              <Textarea
                id="message"
                placeholder="Leave a message of support..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="text-sm sm:text-base min-h-[80px]"
                rows={3}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-2 w-full">
              <div className="flex items-center gap-2 text-sm">
                <UsersIcon className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium break-words">Community Impact</span>
              </div>
              <ul className="text-xs sm:text-sm space-y-1 text-muted-foreground">
                <li>• Server costs and infrastructure</li>
                <li>• Feature development and improvements</li>
                <li>• Community support and documentation</li>
                <li>• Security audits and maintenance</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="w-full">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full text-sm sm:text-base min-h-[44px] sm:min-h-[40px]" size="lg" disabled={!amount || parseFloat(amount) <= 0 || isDonating}>
                  <SendIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {typeof window !== 'undefined' && (window as any).Pi
                    ? `Support with ${amount && parseFloat(amount) > 0 ? amount : ''} π` 
                    : `Support with ${amount && parseFloat(amount) > 0 ? amount : ''} π (Mock)`
                  }
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Your Support</AlertDialogTitle>
                  <AlertDialogDescription className="break-words">
                    {typeof window !== 'undefined' && (window as any).Pi
                      ? `You are about to contribute ${amount} π to support Dynamic Wallet View. This will be processed through the Pi Network. Are you sure?`
                      : `You are about to contribute ${amount} π to support Dynamic Wallet View. This is a mock transaction for development purposes. Are you sure?`
                    }
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDonate} disabled={isDonating} className="min-h-[44px] sm:min-h-[40px]">
                    {isDonating ? <LoadingSpinner className="mr-2" /> : null}
                    {isDonating ? 'Processing...' : `Confirm ${amount} π Support`}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>

        {/* Community Stats */}
        <div className="space-y-4 sm:space-y-6 w-full max-w-full">
          <Card className="w-full max-w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl break-words">
                <TrendingUpIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 flex-shrink-0" />
                Community Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 w-full">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary break-words">
                    {currentDonations.toFixed(1)} π
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground break-words">Total Raised</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary break-words">
                    {recentSupporters.length}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground break-words">Supporters</div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2 w-full">
                <h4 className="font-medium text-sm sm:text-base break-words">Recent Supporters</h4>
                <RecentSupporters supporters={recentSupporters} />
              </div>
            </CardContent>
          </Card>

          <Card className="w-full max-w-full">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg lg:text-xl break-words">Why Support Us?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 w-full">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-sm sm:text-base min-w-0 flex-1">
                  <span className="font-medium">Free & Open Source:</span> We believe in keeping our tools accessible to everyone in the Pi Network community.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-sm sm:text-base min-w-0 flex-1">
                  <span className="font-medium">Community Driven:</span> Your feedback and suggestions directly influence our development roadmap.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-sm sm:text-base min-w-0 flex-1">
                  <span className="font-medium">Privacy First:</span> We never collect or store your personal Pi Network data.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-sm sm:text-base min-w-0 flex-1">
                  <span className="font-medium">Continuous Improvement:</span> Regular updates with new features and improvements based on community needs.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
