import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/databaseService';
import { getSessionUser } from '@/lib/session';
import type { User } from '@/data/schemas';

// GET - Retrieve user settings
export async function GET(request: NextRequest) {
  try {
    // FIXED: Use proper session management
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No session found' },
        { status: 401 }
      );
    }

    const dbUser = await UserService.getUserById(user.id);
    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: (dbUser as User).settings
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
    // FIXED: Use proper session management
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No session found' },
        { status: 401 }
      );
    }

    const { settings } = await request.json();

    if (!settings) {
      return NextResponse.json(
        { success: false, message: 'Settings data is required' },
        { status: 400 }
      );
    }

    // Validate that user exists
    const existingUser = await UserService.getUserById(user.id);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Update user settings
    const updatedUser = await UserService.updateUser(user.id, { settings });

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