import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Use Prisma singleton

/**
 * Handle Cancelled Payment Endpoint (Following Official Pi Network Documentation EXACTLY)
 */
export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    console.log(`❌ [CANCELLED] Handling cancelled payment:`, paymentId);

    // 1. Mark the order record as cancelled (Official Pattern)
    try {
      await prisma.paymentOrder.update({
        where: { paymentId },
        data: { 
          cancelled: true,
          updatedAt: new Date()
        }
      });
      console.log(`✅ [CANCELLED] Order marked as cancelled:`, paymentId);
    } catch (error) {
      console.error(`❌ [CANCELLED] Failed to update order:`, error);
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    console.log(`✅ [CANCELLED] Successfully handled cancelled payment:`, paymentId);
    return NextResponse.json({ 
      message: `Cancelled the payment ${paymentId}` 
    });

  } catch (error) {
    console.error(`❌ [CANCELLED] Cancelled payment handling error:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to handle cancelled payment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
