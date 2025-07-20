'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cancelPiPayment } from '@/services/piService';
import { notifyPaymentCancelled } from '@/services/notificationService';
import { X, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import type { PiPayment } from '@/lib/pi-network';

interface PaymentCancellationCardProps {
  pendingPayments?: PiPayment[];
}

export default function PaymentCancellationCard({ pendingPayments = [] }: PaymentCancellationCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PiPayment[]>(pendingPayments);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    setPayments(pendingPayments);
  }, [pendingPayments]);

  const handleCancelPayment = async (payment: PiPayment) => {
    if (!user) return;
    
    setCancelling(payment.identifier);
    
    try {
      await cancelPiPayment(payment);
      
      // Remove from list
      setPayments(prev => prev.filter(p => p.identifier !== payment.identifier));
      
      // Notify user
      notifyPaymentCancelled(payment.identifier, payment.amount);
      
      toast({
        title: "Payment cancelled",
        description: `Successfully cancelled payment of ${payment.amount} Pi`,
      });
    } catch (error) {
      console.error('Failed to cancel payment:', error);
      toast({
        title: "Cancellation failed",
        description: "Unable to cancel payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancelling(null);
    }
  };

  const pendingCount = payments.filter(p => p.status === 'pending').length;

  if (pendingCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>Pending Payments</span>
            <Badge variant="secondary">0</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No pending payments to cancel
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <span>Pending Payments</span>
          <Badge variant="warning">{pendingCount}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {pendingCount} pending payment{pendingCount > 1 ? 's' : ''} that can be cancelled.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          {payments
            .filter(payment => payment.status === 'pending')
            .map((payment) => (
              <div
                key={payment.identifier}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">
                    {payment.memo || 'Payment'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {payment.amount} Pi • {new Date(payment.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelPayment(payment)}
                    disabled={cancelling === payment.identifier}
                    className="flex items-center gap-2"
                  >
                    {cancelling === payment.identifier ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Cancel</span>
                  </Button>
                </div>
              </div>
            ))}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Pending payments can be cancelled if not yet processed</p>
          <p>• Cancelled payments will be refunded to your wallet</p>
          <p>• You'll receive a notification when cancellation is complete</p>
        </div>
      </CardContent>
    </Card>
  );
} 