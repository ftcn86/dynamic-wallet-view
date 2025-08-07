import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // Mock user settings (in production, this would come from a database)
    const userSettings = {
      theme: 'system',
      language: 'en',
      notifications: true,
      emailNotifications: false,
      remindersEnabled: true,
      reminderHoursBefore: 1
    };

    return NextResponse.json({
      success: true,
      settings: userSettings
    });
  } catch (error) {
    console.error('Failed to fetch user settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { theme, language, notifications, emailNotifications, remindersEnabled, reminderHoursBefore } = body;

    // Validate input
    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      return NextResponse.json(
        { error: 'Theme must be light, dark, or system' },
        { status: 400 }
      );
    }

    if (language && typeof language !== 'string') {
      return NextResponse.json(
        { error: 'Language must be a string' },
        { status: 400 }
      );
    }

    if (typeof notifications !== 'undefined' && typeof notifications !== 'boolean') {
      return NextResponse.json(
        { error: 'Notifications must be a boolean' },
        { status: 400 }
      );
    }

    if (typeof emailNotifications !== 'undefined' && typeof emailNotifications !== 'boolean') {
      return NextResponse.json(
        { error: 'Email notifications must be a boolean' },
        { status: 400 }
      );
    }

    if (typeof remindersEnabled !== 'undefined' && typeof remindersEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Reminders enabled must be a boolean' },
        { status: 400 }
      );
    }

    if (reminderHoursBefore && (typeof reminderHoursBefore !== 'number' || reminderHoursBefore < 0)) {
      return NextResponse.json(
        { error: 'Reminder hours must be a positive number' },
        { status: 400 }
      );
    }

    // Mock settings update (in production, this would update a database)
    console.log('Updating user settings:', body);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      updatedSettings: body
    });
  } catch (error) {
    console.error('Failed to update user settings:', error);
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
} 