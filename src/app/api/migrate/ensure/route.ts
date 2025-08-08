import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * Safe DB ensure endpoint
 * - Creates missing tables and indexes if they do not exist
 * - Non-destructive (does not drop or delete data)
 */
export async function POST(_request: NextRequest) {
  try {
    // Ensure ad_views table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ad_views" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "rewarded" BOOLEAN NOT NULL DEFAULT FALSE,
        "ipHash" TEXT,
        "deviceHash" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes for ad_views
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS ad_views_userId_createdAt_idx ON "ad_views"("userId", "createdAt")`);

    // FK for ad_views -> users(id)
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "ad_views"
          ADD CONSTRAINT ad_views_userId_fkey
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // Ensure payment_orders table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "payment_orders" (
        "id" TEXT PRIMARY KEY,
        "paymentId" TEXT UNIQUE NOT NULL,
        "userId" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "memo" TEXT NOT NULL,
        "metadata" JSONB,
        "txid" TEXT,
        "paid" BOOLEAN NOT NULL DEFAULT FALSE,
        "cancelled" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS payment_orders_paymentId_idx ON "payment_orders"("paymentId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS payment_orders_userId_paid_idx ON "payment_orders"("userId", "paid")`);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "payment_orders"
          ADD CONSTRAINT payment_orders_userId_fkey
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ensure migrate error:', error);
    return NextResponse.json({ error: 'Failed to ensure tables' }, { status: 500 });
  }
}


