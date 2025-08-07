'use client';

import type { PiPayment, PiPaymentData } from '@/lib/pi-network';
import { getPiSDKInstance } from '@/lib/pi-network';

export interface PaymentData {
  amount: number;
  memo: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  txid?: string;
  error?: string;
}

export interface PaymentCallbacks {
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export class PaymentService {
  private static activePayments = new Map<string, {
    paymentId: string;
    status: 'pending' | 'approved' | 'completed' | 'cancelled' | 'failed';
    amount: number;
    memo: string;
    createdAt: string;
    txid?: string;
    completedAt?: string;
  }>();

  /**
   * Create a Pi Network payment following official patterns
   */
  static async createPayment(data: PaymentData, callbacks?: PaymentCallbacks): Promise<PaymentResult> {
    try {
      console.log('🚀 Creating Pi Network payment:', data);

      const sdk = getPiSDKInstance();
      if (!sdk) {
        throw new Error('Pi Network SDK not available');
      }

      // Prepare payment data
      const paymentData: PiPaymentData = {
        amount: data.amount,
        memo: data.memo,
        metadata: data.metadata || {}
      };

      // Create payment using official SDK pattern
      const payment = await sdk.createPayment(paymentData, {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log('✅ Payment ready for approval:', paymentId);
          
          // Store payment info
          this.activePayments.set(paymentId, {
            paymentId,
            status: 'pending',
            amount: data.amount,
            memo: data.memo,
            createdAt: new Date().toISOString()
          });

          try {
            // Call backend to approve payment (Official Pattern)
            const response = await fetch('/api/payments/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                paymentId, 
                metadata: paymentData.metadata 
              }),
              credentials: 'include'
            });

            if (!response.ok) {
              throw new Error(`Backend approval failed: ${response.status}`);
            }

            console.log('✅ Payment approved by backend');
            const paymentInfo = this.activePayments.get(paymentId);
            if (paymentInfo) {
              paymentInfo.status = 'approved';
            }
          } catch (error) {
            console.error('❌ Backend approval failed:', error);
            const paymentInfo = this.activePayments.get(paymentId);
            if (paymentInfo) {
              paymentInfo.status = 'failed';
            }
            callbacks?.onError?.(`Payment approval failed: ${error}`);
          }
        },

        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log('✅ Payment ready for completion:', paymentId, txid);

          try {
            // Call backend to complete payment (Official Pattern)
            const response = await fetch('/api/payments/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, txid }),
              credentials: 'include'
            });

            if (!response.ok) {
              throw new Error(`Backend completion failed: ${response.status}`);
            }

            console.log('✅ Payment completed by backend');
            
            // Update payment info
            const paymentInfo = this.activePayments.get(paymentId);
            if (paymentInfo) {
              paymentInfo.status = 'completed';
              paymentInfo.txid = txid;
              paymentInfo.completedAt = new Date().toISOString();
            }

            // Call success callback
            callbacks?.onSuccess?.({
              success: true,
              paymentId,
              txid
            });

          } catch (error) {
            console.error('❌ Backend completion failed:', error);
            const paymentInfo = this.activePayments.get(paymentId);
            if (paymentInfo) {
              paymentInfo.status = 'failed';
            }
            callbacks?.onError?.(`Payment completion failed: ${error}`);
          }
        },

        onCancel: (paymentId: string) => {
          console.log('❌ Payment cancelled:', paymentId);
          
          // Update payment info
          const paymentInfo = this.activePayments.get(paymentId);
          if (paymentInfo) {
            paymentInfo.status = 'cancelled';
          }

          // Call backend to handle cancellation (Official Pattern)
          fetch('/api/payments/cancelled_payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId }),
            credentials: 'include'
          }).catch(error => {
            console.error('❌ Backend cancellation failed:', error);
          });

          callbacks?.onCancel?.();
        },

        onError: (error: Error, payment: PiPayment) => {
          console.error('❌ Payment error:', error, payment);
          
          const paymentInfo = this.activePayments.get(payment.identifier);
          if (paymentInfo) {
            paymentInfo.status = 'failed';
          }

          callbacks?.onError?.(error.message);
        }
      });

      return {
        success: true,
        paymentId: payment.identifier
      };

    } catch (error) {
      console.error('❌ Payment creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed'
      };
    }
  }

  /**
   * Get payment status
   */
  static getPaymentStatus(paymentId: string) {
    return this.activePayments.get(paymentId);
  }

  /**
   * Get all active payments
   */
  static getActivePayments() {
    return Array.from(this.activePayments.values());
  }

  /**
   * Clear completed payments
   */
  static clearCompletedPayments() {
    for (const [paymentId, payment] of this.activePayments.entries()) {
      if (payment.status === 'completed' || payment.status === 'cancelled' || payment.status === 'failed') {
        this.activePayments.delete(paymentId);
      }
    }
  }
} 