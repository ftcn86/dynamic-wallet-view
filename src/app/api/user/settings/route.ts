import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for user settings (in production, this would be a database)
let userSettings = {
  id: 'user_001',
  name: 'John Doe',
  bio: 'Active Pi Network pioneer and node operator',
  avatarUrl: '',
  settings: {
    remindersEnabled: true,
    reminderHoursBefore: 2,
  },
};

/**
 * POST /api/user/settings
 * Update user profile and settings
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const { name, bio, avatarUrl, settings } = await request.json();

    // Validate input
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Name must be a non-empty string' },
        { status: 400 }
      );
    }

    if (bio !== undefined && typeof bio !== 'string') {
      return NextResponse.json(
        { error: 'Bio must be a string' },
        { status: 400 }
      );
    }

    if (avatarUrl !== undefined && typeof avatarUrl !== 'string') {
      return NextResponse.json(
        { error: 'Avatar URL must be a string' },
        { status: 400 }
      );
    }

    if (settings !== undefined) {
      if (typeof settings !== 'object' || settings === null) {
        return NextResponse.json(
          { error: 'Settings must be an object' },
          { status: 400 }
        );
      }

      if (settings.remindersEnabled !== undefined && typeof settings.remindersEnabled !== 'boolean') {
        return NextResponse.json(
          { error: 'remindersEnabled must be a boolean' },
          { status: 400 }
        );
      }

      if (settings.reminderHoursBefore !== undefined && (typeof settings.reminderHoursBefore !== 'number' || settings.reminderHoursBefore < 0)) {
        return NextResponse.json(
          { error: 'reminderHoursBefore must be a non-negative number' },
          { status: 400 }
        );
      }
    }

    // Update user settings
    if (name !== undefined) {
      userSettings.name = name;
    }

    if (bio !== undefined) {
      userSettings.bio = bio;
    }

    if (avatarUrl !== undefined) {
      userSettings.avatarUrl = avatarUrl;
    }

    if (settings !== undefined) {
      if (settings.remindersEnabled !== undefined) {
        userSettings.settings.remindersEnabled = settings.remindersEnabled;
      }
      if (settings.reminderHoursBefore !== undefined) {
        userSettings.settings.reminderHoursBefore = settings.reminderHoursBefore;
      }
    }

    console.log('User settings updated:', userSettings);

    return NextResponse.json({
      success: true,
      user: userSettings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Failed to update user settings:', error);
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/settings
 * Get current user settings
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: userSettings,
    });
  } catch (error) {
    console.error('Failed to fetch user settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    );
  }
} 