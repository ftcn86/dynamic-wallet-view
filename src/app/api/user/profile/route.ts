import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/databaseService';
import { getSessionUser } from '@/lib/session';

// GET - Retrieve user profile
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
      user: dbUser
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
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

    const { ...updateData } = await request.json();

    // Validate that user exists
    const existingUser = await UserService.getUserById(user.id);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Update user
    const updatedUser = await UserService.updateUser(user.id, updateData);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 