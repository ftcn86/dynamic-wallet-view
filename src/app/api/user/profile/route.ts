import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/databaseService';

// GET - Retrieve user profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');

    if (!userId && !username) {
      return NextResponse.json(
        { success: false, message: 'User ID or username is required' },
        { status: 400 }
      );
    }

    let user;
    if (userId) {
      user = await UserService.getUserById(userId);
    } else if (username) {
      user = await UserService.getUserByUsername(username);
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user
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
    const { userId, ...updateData } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
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

    // Update user
    const updatedUser = await UserService.updateUser(userId, updateData);

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