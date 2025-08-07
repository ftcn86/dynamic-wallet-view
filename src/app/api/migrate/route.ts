import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Database Cleanup Endpoint
 * This will DELETE ALL DATA and reset the database to match our schema exactly
 * 
 * WARNING: This will permanently delete all user data, sessions, and payments
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ [CLEANUP] Starting complete database cleanup...');

    // 1. Delete all data from all tables (in correct order due to foreign keys)
    console.log('🗑️ [CLEANUP] Deleting all data...');
    
    // Delete in order to respect foreign key constraints
    await prisma.$executeRaw`DELETE FROM "user_sessions"`;
    await prisma.$executeRaw`DELETE FROM "payment_orders"`;
    await prisma.$executeRaw`DELETE FROM "user_badges"`;
    await prisma.$executeRaw`DELETE FROM "team_members"`;
    await prisma.$executeRaw`DELETE FROM "node_performance_history"`;
    await prisma.$executeRaw`DELETE FROM "node_data"`;
    await prisma.$executeRaw`DELETE FROM "transactions"`;
    await prisma.$executeRaw`DELETE FROM "notifications"`;
    await prisma.$executeRaw`DELETE FROM "balance_history"`;
    await prisma.$executeRaw`DELETE FROM "user_settings"`;
    await prisma.$executeRaw`DELETE FROM "balance_breakdowns"`;
    await prisma.$executeRaw`DELETE FROM "unverified_pi_details"`;
    await prisma.$executeRaw`DELETE FROM "badges"`;
    await prisma.$executeRaw`DELETE FROM "users"`;
    
    console.log('✅ [CLEANUP] All data deleted successfully');

    // 2. Drop and recreate tables to match our schema exactly
    console.log('🏗️ [CLEANUP] Recreating tables with correct schema...');
    
    // Drop all tables (in reverse order due to foreign keys)
    await prisma.$executeRaw`DROP TABLE IF EXISTS "user_sessions" CASCADE`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "payment_orders" CASCADE`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "user_badges" CASCADE`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "team_members" CASCADE`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "node_performance_history" CASCADE`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "node_data" CASCADE`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "transactions" CASCADE`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "notifications" CASCADE`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "balance_history" CASCADE`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "user_settings" CASCADE`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "balance_breakdowns" CASCADE`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "unverified_pi_details" CASCADE`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "badges" CASCADE`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "users" CASCADE`;
    
    console.log('✅ [CLEANUP] All tables dropped successfully');

    // 3. Create tables with correct schema (matching our Prisma schema)
    console.log('🏗️ [CLEANUP] Creating tables with correct schema...');
    
    // Create users table (NO name column)
    await prisma.$executeRaw`CREATE TABLE "users" (
      "id" TEXT NOT NULL,
      "uid" TEXT NOT NULL,
      "username" TEXT NOT NULL,
      "accessToken" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "users_pkey" PRIMARY KEY ("id")
    )`;

    // Create user_sessions table
    await prisma.$executeRaw`CREATE TABLE "user_sessions" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "sessionToken" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
    )`;

    // Create payment_orders table
    await prisma.$executeRaw`CREATE TABLE "payment_orders" (
      "id" TEXT NOT NULL,
      "paymentId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "amount" DOUBLE PRECISION NOT NULL,
      "memo" TEXT NOT NULL,
      "metadata" JSONB,
      "txid" TEXT,
      "paid" BOOLEAN NOT NULL DEFAULT false,
      "cancelled" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
    )`;

    // Create legacy tables
    await prisma.$executeRaw`CREATE TABLE "user_settings" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "theme" TEXT NOT NULL DEFAULT 'system',
      "language" TEXT NOT NULL DEFAULT 'en',
      "notifications" BOOLEAN NOT NULL DEFAULT true,
      "emailNotifications" BOOLEAN NOT NULL DEFAULT false,
      "remindersEnabled" BOOLEAN NOT NULL DEFAULT false,
      "reminderHoursBefore" INTEGER NOT NULL DEFAULT 1,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
    )`;

    await prisma.$executeRaw`CREATE TABLE "balance_breakdowns" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "transferableToMainnet" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "totalUnverifiedPi" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "currentlyInLockups" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "balance_breakdowns_pkey" PRIMARY KEY ("id")
    )`;

    await prisma.$executeRaw`CREATE TABLE "unverified_pi_details" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "fromReferralTeam" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "fromSecurityCircle" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "fromNodeRewards" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "fromOtherBonuses" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "unverified_pi_details_pkey" PRIMARY KEY ("id")
    )`;

    await prisma.$executeRaw`CREATE TABLE "badges" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "iconUrl" TEXT NOT NULL,
      "dataAiHint" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
    )`;

    await prisma.$executeRaw`CREATE TABLE "user_badges" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "badgeId" TEXT NOT NULL,
      "earned" BOOLEAN NOT NULL DEFAULT false,
      "earnedDate" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
    )`;

    await prisma.$executeRaw`CREATE TABLE "team_members" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "avatarUrl" TEXT NOT NULL,
      "joinDate" TIMESTAMP(3) NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "unverifiedPiContribution" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "teamMemberActiveMiningHours_LastWeek" DOUBLE PRECISION DEFAULT 0,
      "teamMemberActiveMiningHours_LastMonth" DOUBLE PRECISION DEFAULT 0,
      "kycStatus" TEXT NOT NULL DEFAULT 'NOT_COMPLETED',
      "dataAiHint" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
    )`;

    await prisma.$executeRaw`CREATE TABLE "node_data" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "nodeId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'OFFLINE',
      "lastSeen" TIMESTAMP(3) NOT NULL,
      "nodeSoftwareVersion" TEXT NOT NULL,
      "latestSoftwareVersion" TEXT NOT NULL,
      "country" TEXT NOT NULL,
      "countryFlag" TEXT NOT NULL,
      "uptimePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "blocksProcessed" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "node_data_pkey" PRIMARY KEY ("id")
    )`;

    await prisma.$executeRaw`CREATE TABLE "node_performance_history" (
      "id" TEXT NOT NULL,
      "nodeDataId" TEXT NOT NULL,
      "date" TIMESTAMP(3) NOT NULL,
      "score" DOUBLE PRECISION NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "node_performance_history_pkey" PRIMARY KEY ("id")
    )`;

    await prisma.$executeRaw`CREATE TABLE "transactions" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "date" TIMESTAMP(3) NOT NULL,
      "type" TEXT NOT NULL,
      "amount" DOUBLE PRECISION NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "from" TEXT,
      "to" TEXT,
      "description" TEXT NOT NULL,
      "blockExplorerUrl" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
    )`;

    await prisma.$executeRaw`CREATE TABLE "notifications" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "read" BOOLEAN NOT NULL DEFAULT false,
      "link" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
    )`;

    await prisma.$executeRaw`CREATE TABLE "balance_history" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "date" TIMESTAMP(3) NOT NULL,
      "transferable" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "unverified" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "balance_history_pkey" PRIMARY KEY ("id")
    )`;

    // 4. Create indexes and constraints
    console.log('🔗 [CLEANUP] Creating indexes and constraints...');
    
    // Users table indexes
    await prisma.$executeRaw`CREATE UNIQUE INDEX "users_uid_key" ON "users"("uid")`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX "users_username_key" ON "users"("username")`;
    
    // User sessions indexes
    await prisma.$executeRaw`CREATE UNIQUE INDEX "user_sessions_sessionToken_key" ON "user_sessions"("sessionToken")`;
    await prisma.$executeRaw`CREATE INDEX "user_sessions_sessionToken_idx" ON "user_sessions"("sessionToken")`;
    await prisma.$executeRaw`CREATE INDEX "user_sessions_userId_isActive_idx" ON "user_sessions"("userId", "isActive")`;
    
    // Payment orders indexes
    await prisma.$executeRaw`CREATE UNIQUE INDEX "payment_orders_paymentId_key" ON "payment_orders"("paymentId")`;
    await prisma.$executeRaw`CREATE INDEX "payment_orders_paymentId_idx" ON "payment_orders"("paymentId")`;
    await prisma.$executeRaw`CREATE INDEX "payment_orders_userId_paid_idx" ON "payment_orders"("userId", "paid")`;
    
    // Legacy table indexes
    await prisma.$executeRaw`CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId")`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX "balance_breakdowns_userId_key" ON "balance_breakdowns"("userId")`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX "unverified_pi_details_userId_key" ON "unverified_pi_details"("userId")`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX "user_badges_userId_badgeId_key" ON "user_badges"("userId", "badgeId")`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX "node_data_userId_key" ON "node_data"("userId")`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX "balance_history_userId_date_key" ON "balance_history"("userId", "date")`;
    await prisma.$executeRaw`CREATE INDEX "transactions_userId_date_idx" ON "transactions"("userId", "date")`;
    await prisma.$executeRaw`CREATE INDEX "transactions_userId_type_idx" ON "transactions"("userId", "type")`;
    await prisma.$executeRaw`CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read")`;
    await prisma.$executeRaw`CREATE INDEX "notifications_userId_date_idx" ON "notifications"("userId", "date")`;
    await prisma.$executeRaw`CREATE INDEX "balance_history_userId_date_idx" ON "balance_history"("userId", "date")`;
    
    // Foreign key constraints
    await prisma.$executeRaw`ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
    await prisma.$executeRaw`ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
    await prisma.$executeRaw`ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
    await prisma.$executeRaw`ALTER TABLE "balance_breakdowns" ADD CONSTRAINT "balance_breakdowns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
    await prisma.$executeRaw`ALTER TABLE "unverified_pi_details" ADD CONSTRAINT "unverified_pi_details_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
    await prisma.$executeRaw`ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
    await prisma.$executeRaw`ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
    await prisma.$executeRaw`ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
    await prisma.$executeRaw`ALTER TABLE "node_data" ADD CONSTRAINT "node_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
    await prisma.$executeRaw`ALTER TABLE "node_performance_history" ADD CONSTRAINT "node_performance_history_nodeDataId_fkey" FOREIGN KEY ("nodeDataId") REFERENCES "node_data"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
    await prisma.$executeRaw`ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
    await prisma.$executeRaw`ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
    await prisma.$executeRaw`ALTER TABLE "balance_history" ADD CONSTRAINT "balance_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`;

    console.log('✅ [CLEANUP] Database completely reset and recreated successfully');

    // Verify final state
    const finalTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('📋 [CLEANUP] Final tables in database:', finalTables);

    return NextResponse.json({
      success: true,
      message: 'Database completely cleaned and reset successfully',
      tables: finalTables,
      note: 'All data has been permanently deleted and tables recreated with correct schema'
    });

  } catch (error) {
    console.error('❌ [CLEANUP] Database cleanup failed:', error);
    return NextResponse.json(
      { 
        error: 'Database cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
