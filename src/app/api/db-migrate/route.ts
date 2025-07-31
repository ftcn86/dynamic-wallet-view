import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Temporary endpoint to run database migration
 * This should be removed after the migration is complete
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting database migration...');
    
    // Push the schema to the database
    const { execSync } = require('child_process');
    
    try {
      execSync('npx prisma db push --accept-data-loss', { 
        stdio: 'inherit',
        env: { ...process.env }
      });
      console.log('✅ Database migration completed successfully');
    } catch (error) {
      console.error('❌ Database migration failed:', error);
      return NextResponse.json(
        { error: 'Database migration failed', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully'
    });
  } catch (error) {
    console.error('❌ Migration endpoint error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
} 