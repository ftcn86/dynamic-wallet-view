import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';

/**
 * Incomplete Payments Endpoint (Following Official Demo Pattern)
 * 
 * This endpoint handles incomplete payments found during authentication.
 * It follows the exact same pattern as the official Pi Network demo.
 */

export async function POST(request: NextRequest) {
  try {
    const { payment } = await request.json();

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment data is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Handling incomplete payment:', payment.identifier);

    const paymentId = payment.identifier;
    const txid = payment.transaction && payment.transaction.txid;
    const txURL = payment.transaction && payment.transaction._link;

    if (!txid || !txURL) {
      console.log('⚠️ No transaction data found for incomplete payment');
      return NextResponse.json(
        { error: 'No transaction data found' },
        { status: 400 }
      );
    }

    console.log('📋 Payment details:', {
      paymentId,
      txid,
      txURL,
      amount: payment.amount,
      memo: payment.memo,
      status: payment.status
    });

    const piPlatformClient = getPiPlatformAPIClient();

    try {
      // In a real app, you would:
      // 1. Check your database for the corresponding order
      // 2. Verify the transaction on the blockchain
      // 3. Mark the order as paid
      // 4. Complete the payment with Pi Network

      // Find the incomplete order (mock implementation)
      console.log('🔍 Looking for order with payment ID:', paymentId);
      const order = {
        pi_payment_id: paymentId,
        product_id: 'donation',
        user_uid: payment.user_uid,
        amount: payment.amount,
        memo: payment.memo,
        txid: null,
        paid: false,
        cancelled: false,
        created_at: new Date().toISOString()
      };

      if (!order) {
        console.log('❌ Order not found for payment:', paymentId);
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 400 }
        );
      }

      // Verify the transaction on the Pi blockchain
      console.log('🔍 Verifying transaction on blockchain:', txURL);
      try {
        const horizonResponse = await fetch(txURL);
        if (!horizonResponse.ok) {
          throw new Error(`Blockchain API error: ${horizonResponse.status}`);
        }
        
        const transactionData = await horizonResponse.json();
        console.log('📋 Transaction data:', {
          memo: transactionData.memo,
          amount: transactionData.amount,
          from: transactionData.from,
          to: transactionData.to
        });

        // Verify payment ID matches
        const paymentIdOnBlock = transactionData.memo;
        if (paymentIdOnBlock !== order.pi_payment_id) {
          console.log('❌ Payment ID mismatch:', {
            expected: order.pi_payment_id,
            found: paymentIdOnBlock
          });
          return NextResponse.json(
            { error: 'Payment ID does not match' },
            { status: 400 }
          );
        }

        // Verify amount matches
        if (parseFloat(transactionData.amount) !== payment.amount) {
          console.log('❌ Amount mismatch:', {
            expected: payment.amount,
            found: transactionData.amount
          });
          return NextResponse.json(
            { error: 'Payment amount does not match' },
            { status: 400 }
          );
        }

        console.log('✅ Transaction verification successful');

      } catch (blockchainError) {
        console.error('❌ Blockchain verification failed:', blockchainError);
        return NextResponse.json(
          { error: 'Transaction verification failed' },
          { status: 500 }
        );
      }

      // Mark the order as paid
      const updatedOrder = {
        ...order,
        txid: txid,
        paid: true,
        completed_at: new Date().toISOString(),
        transaction_verified: true
      };

      console.log('📝 Updated order record:', updatedOrder);

      // Complete the payment with Pi Network
      await piPlatformClient.completePayment(paymentId, txid);
      console.log('✅ Payment completed successfully');

      // Add transaction to history
      try {
        const { addTransaction } = await import('@/services/piService');
        addTransaction({
          type: 'sent',
          amount: payment.amount,
          status: 'completed',
          description: payment.memo || 'Incomplete payment completed',
          blockExplorerUrl: txURL
        });
        console.log('✅ Transaction added to history');
      } catch (transactionError) {
        console.warn('⚠️ Failed to add transaction:', transactionError);
      }

      // Add success notification
      try {
        const { addNotification } = await import('@/services/notificationService');
        addNotification(
          'announcement',
          'Incomplete Payment Completed',
          `Your incomplete payment of ${payment.amount}π has been completed successfully.`,
          '/dashboard/transactions'
        );
        console.log('✅ Notification added');
      } catch (notificationError) {
        console.warn('⚠️ Failed to add notification:', notificationError);
      }

      return NextResponse.json({
        success: true,
        message: `Handled the incomplete payment ${paymentId}`,
        order: updatedOrder,
        transaction: {
          id: txid,
          verified: true,
          blockExplorerUrl: txURL
        }
      });

    } catch (platformError) {
      console.error('❌ Payment completion failed:', platformError);
      
      // Add error notification
      try {
        const { addNotification } = await import('@/services/notificationService');
        addNotification(
          'announcement',
          'Incomplete Payment Failed',
          `Failed to complete incomplete payment ${paymentId}. Please contact support.`,
          '/dashboard/transactions'
        );
      } catch (notificationError) {
        console.warn('⚠️ Failed to add error notification:', notificationError);
      }

      return NextResponse.json(
        { 
          error: 'Failed to complete payment',
          details: platformError instanceof Error ? platformError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Incomplete payment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 