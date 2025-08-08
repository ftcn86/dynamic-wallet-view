'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PaymentService, type PaymentData } from '@/services/paymentService';
// Transactions are stored server-side after payment completion
import { HeartIcon, SendIcon } from '@/components/shared/icons';
import * as Log from '@/lib/log';

interface PaymentFormProps {
  title?: string;
  description?: string;
  defaultAmount?: number;
  presetAmounts?: number[];
  onSuccess?: (result: { amount: number; memo: string; txid?: string }) => void;
  onError?: (error: string) => void;
}

export function PaymentForm({
  title = "Make a Payment",
  description = "Send Pi to support this project",
  defaultAmount = 1,
  presetAmounts = [1, 2.5, 5, 10, 25],
  onSuccess,
  onError
}: PaymentFormProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [memo, setMemo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePresetAmount = (presetAmount: number) => {
    setAmount(presetAmount.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast({ 
        title: "Invalid amount", 
        description: "Please enter a valid amount greater than 0",
        variant: "destructive" 
      });
      return;
    }

    setIsProcessing(true);

    try {
      const paymentData: PaymentData = {
        amount: paymentAmount,
        memo: memo.trim() || title,
        metadata: {
          type: 'payment',
          app: 'dynamic-wallet-view',
          timestamp: new Date().toISOString()
        }
      };

      const result = await PaymentService.createPayment(paymentData, {
        onSuccess: async (paymentResult) => {
          Log.log('✅ Payment successful:', paymentResult);

          toast({
            title: "Payment Successful!",
            description: `Successfully sent ${paymentAmount} π`,
          });

          onSuccess?.({ amount: paymentAmount, memo: memo.trim() || title, txid: paymentResult.txid });
          
          // Reset form
          setAmount(defaultAmount.toString());
          setMemo('');
        },
        onError: (error) => {
          Log.error('❌ Payment failed:', error);
          toast({
            title: "Payment Failed",
            description: error,
            variant: "destructive"
          });
          onError?.(error);
        },
        onCancel: () => {
          Log.log('❌ Payment cancelled by user');
          toast({
            title: "Payment Cancelled",
            description: "Payment was cancelled",
          });
        }
      });

      if (!result.success) {
        throw new Error(result.error || 'Payment creation failed');
      }

    } catch (error) {
      Log.error('❌ Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive"
      });
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartIcon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Amount (π)
            </label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              disabled={isProcessing}
              required
            />
          </div>

          {/* Preset Amounts */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Amounts</label>
            <div className="flex flex-wrap gap-2">
              {presetAmounts.map((presetAmount) => (
                <Button
                  key={presetAmount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetAmount(presetAmount)}
                  disabled={isProcessing}
                >
                  {presetAmount} π
                </Button>
              ))}
            </div>
          </div>

          {/* Memo Input */}
          <div className="space-y-2">
            <label htmlFor="memo" className="text-sm font-medium">
              Message (Optional)
            </label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Add a message..."
              rows={3}
              disabled={isProcessing}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
            <span className="ml-2">
              {isProcessing ? 'Processing...' : `Send ${amount} π`}
            </span>
          </Button>
        </CardContent>
      </form>
    </Card>
  );
} 