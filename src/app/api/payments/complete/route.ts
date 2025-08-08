import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import { NotificationService } from '@/services/databaseService';
import prisma from '@/lib/db';

// Use Prisma singleton

/**
 * Payment Completion Endpoint (Following Official Pi Network Documentation EXACTLY)
 */
export async function POST(request: NextRequest) {
  try {
    const { rateLimit } = await import('@/lib/rate-limit');
    await rateLimit(request as unknown as Request, 'payments:complete', 30, 60_000);
    const { paymentId, txid } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    if (!txid) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [COMPLETE] Request received for paymentId:`, paymentId, 'txid:', txid);
    const piPlatformClient = getPiPlatformAPIClient();

    // 1. Get authenticated user from session (Official Pattern)
    const sessionToken = request.cookies.get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // 2. Get user from session (Official Pattern)
    let currentUser;
    try {
      const session = await prisma.userSession.findFirst({
        where: { 
          sessionToken,
          isActive: true,
          expiresAt: { gt: new Date() }
        },
        include: { user: true }
      });

      if (!session) {
        return NextResponse.json(
          { error: 'Invalid session' },
          { status: 401 }
        );
      }

      currentUser = session.user;
      console.log(`✅ [COMPLETE] User verified:`, currentUser.uid);
    } catch (error) {
      console.error(`❌ [COMPLETE] Session verification failed:`, error);
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // 3. Update order record (Official Pattern)
    try {
      await prisma.paymentOrder.update({
        where: { paymentId },
        data: { 
          txid: txid, 
          paid: true,
          updatedAt: new Date()
        }
      });
      console.log(`✅ [COMPLETE] Order record updated for payment:`, paymentId);
    } catch (error) {
      console.error(`❌ [COMPLETE] Failed to update order record:`, error);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // 4. Complete the payment with Pi Network (Official Pattern)
    try {
      console.log(`🔗 [COMPLETE] Calling piPlatformClient.completePayment...`);
      await piPlatformClient.completePayment(paymentId, txid);
      console.log(`✅ [COMPLETE] Payment completed successfully`);
      
      // 5. Store transaction (NON-CRITICAL, can fail safely)
      try {
        console.log(`💾 [COMPLETE] Storing transaction after successful payment...`);
        const storeResponse = await fetch(`${request.nextUrl.origin}/api/transactions/store`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            paymentId,
            txid,
            metadata: { to: 'Dynamic Wallet View' }
          })
        });
        
        if (storeResponse.ok) {
          console.log(`✅ [COMPLETE] Transaction stored successfully`);
        } else {
          console.warn(`⚠️ [COMPLETE] Transaction storage failed, but payment is complete`);
        }
      } catch (storageError) {
        console.warn(`⚠️ [COMPLETE] Transaction storage failed, but payment is complete:`, storageError);
      }

      // 6. Notify and return success
      try {
        await NotificationService.createNotification(currentUser.id, {
          type: 'TEAM_UPDATE' as any,
          title: 'Payment Completed',
          description: `Your payment ${paymentId} was completed.`,
          link: '/dashboard/transactions'
        });
      } catch {}
      return NextResponse.json({ message: `Completed the payment ${paymentId}` });

    } catch (completionError) {
      console.error(`❌ [COMPLETE] Payment completion failed:`, completionError);
      
      // Revert order record if completion failed
      try {
        await prisma.paymentOrder.update({
          where: { paymentId },
          data: { 
            paid: false,
            txid: null,
            updatedAt: new Date()
          }
        });
        console.log(`🔄 [COMPLETE] Reverted order record after failed completion`);
      } catch (revertError) {
        console.error(`❌ [COMPLETE] Failed to revert order record:`, revertError);
      }

      return NextResponse.json(
        { 
          error: 'Payment completion failed',
          message: completionError instanceof Error ? completionError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error(`❌ [COMPLETE] Payment completion endpoint error:`, error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 