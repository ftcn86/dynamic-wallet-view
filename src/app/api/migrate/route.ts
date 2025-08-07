import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Temporary Migration Endpoint
 * This will update existing tables to match the new schema
 * 
 * WARNING: This should be removed after migration is complete
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [MIGRATION] Starting database migration...');

    // Check if tables already exist
    const existingTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('📋 [MIGRATION] Existing tables:', existingTables);

    // Check if users table exists and has required columns
    const usersColumns = await prisma.$queryRaw`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
    ` as Array<{ column_name: string; is_nullable: string; data_type: string }>;
    
    console.log('📋 [MIGRATION] Users table columns:', usersColumns);
    
    const hasUidColumn = usersColumns.some((col) => col.column_name === 'uid');
    const hasAccessTokenColumn = usersColumns.some((col) => col.column_name === 'accessToken');
    const hasNameColumn = usersColumns.some((col) => col.column_name === 'name');
    const nameColumnNullable = usersColumns.find((col) => col.column_name === 'name')?.is_nullable === 'YES';

    console.log('🔧 [MIGRATION] Column check:', { 
      hasUidColumn, 
      hasAccessTokenColumn, 
      hasNameColumn, 
      nameColumnNullable 
    });

    // Update users table if needed
    if (!hasUidColumn) {
      console.log('🏗️ [MIGRATION] Adding uid column to users table...');
      await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN "uid" TEXT`;
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "users_uid_key" ON "users"("uid")`;
    }

    if (!hasAccessTokenColumn) {
      console.log('🏗️ [MIGRATION] Adding accessToken column to users table...');
      await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN "accessToken" TEXT`;
    }

    // Handle the name column issue - make it nullable if it exists and is not nullable
    if (hasNameColumn && !nameColumnNullable) {
      console.log('🏗️ [MIGRATION] Making name column nullable...');
      await prisma.$executeRaw`ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL`;
    }

    // Check if user_sessions table has required columns
    const sessionsColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_sessions' AND table_schema = 'public'
    ` as Array<{ column_name: string }>;
    
    const hasIsActiveColumn = sessionsColumns.some((col) => col.column_name === 'isActive');

    if (!hasIsActiveColumn) {
      console.log('🏗️ [MIGRATION] Adding isActive column to user_sessions table...');
      await prisma.$executeRaw`ALTER TABLE "user_sessions" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true`;
    }

    // Check if payment_orders table has required columns
    const paymentColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payment_orders' AND table_schema = 'public'
    ` as Array<{ column_name: string }>;
    
    const hasCancelledColumn = paymentColumns.some((col) => col.column_name === 'cancelled');

    if (!hasCancelledColumn) {
      console.log('🏗️ [MIGRATION] Adding cancelled column to payment_orders table...');
      await prisma.$executeRaw`ALTER TABLE "payment_orders" ADD COLUMN "cancelled" BOOLEAN NOT NULL DEFAULT false`;
    }

    console.log('✅ [MIGRATION] Database schema updated successfully');

    // Verify final state
    const finalTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('📋 [MIGRATION] Final tables in database:', finalTables);

    return NextResponse.json({
      success: true,
      message: 'Database schema updated successfully',
      tables: finalTables,
      updated: {
        addedUidColumn: !hasUidColumn,
        addedAccessTokenColumn: !hasAccessTokenColumn,
        madeNameNullable: hasNameColumn && !nameColumnNullable,
        addedIsActiveColumn: !hasIsActiveColumn,
        addedCancelledColumn: !hasCancelledColumn
      }
    });

  } catch (error) {
    console.error('❌ [MIGRATION] Migration failed:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
