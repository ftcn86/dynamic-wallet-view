import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/databaseService';
import type { User } from '@/data/schemas';

// GET - Retrieve user settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await UserService.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: (user as User).settings
    });

  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve settings',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const { userId, settings } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!settings) {
      return NextResponse.json(
        { success: false, message: 'Settings data is required' },
        { status: 400 }
      );
    }

    // Validate that user exists
    const existingUser = await UserService.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Update user settings
    const updatedUser = await UserService.updateUser(userId, { settings });

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: (updatedUser as User).settings
    });

  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update settings',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 