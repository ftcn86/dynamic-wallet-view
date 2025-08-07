import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/session';
import { NotificationService } from '@/services/databaseService';

// We need to access the same notifications array from the main notifications API
// For now, we'll simulate the behavior since we can't easily share the array between files
// In production, this would be a database operation

/**
 * POST /api/notifications/[id]/read
 * Mark a specific notification as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const { id: notificationId } = await params;
    await NotificationService.markAsRead(notificationId);

    return NextResponse.json({
      success: true,
      message: `Notification ${notificationId} marked as read`,
      notificationId,
    });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
} 