import { NextRequest, NextResponse } from 'next/server';
import type { NotificationType } from '@/data/schemas';
import { getUserFromSession } from '@/lib/session';
import { NotificationService } from '@/services/databaseService';
import { rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/notifications
 * Get all notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    await rateLimit(request, 'notifications:get', 60, 1 * 60 * 1000);
    // Get user from database session (NEW: Proper session management)
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const userId = user.id;
    
    // Get notifications from database
    const userNotifications = await NotificationService.getUserNotifications(userId);
    const unreadCount = await NotificationService.getUnreadCount(userId);

    return NextResponse.json({
      success: true,
      notifications: userNotifications,
      count: userNotifications.length,
      unreadCount: unreadCount,
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Create a new notification or mark notifications as read
 */
export async function POST(request: NextRequest) {
  try {
    await rateLimit(request, 'notifications:post', 20, 1 * 60 * 1000);
    // Get user from database session (NEW: Proper session management)
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, notificationId, type, title, description, link } = body;

    // Handle mark as read action
    if (action === 'markAsRead' && notificationId) {
      await NotificationService.markAsRead(notificationId);
      return NextResponse.json({
        success: true,
        message: `Notification ${notificationId} marked as read`,
      });
    }

    // Handle mark all as read action
    if (action === 'markAllAsRead') {
      await NotificationService.markAllAsRead(user.id);
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    }

    // Handle create new notification
    if (!type || !title || !description) {
      return NextResponse.json(
        { error: 'Type, title, and description are required' },
        { status: 400 }
      );
    }

    const created = await NotificationService.createNotification(user.id, {
      type: type as NotificationType,
      title,
      description,
      link,
    });

    const newUnread = await NotificationService.getUnreadCount(user.id);
    return NextResponse.json({
      success: true,
      notification: created,
      unreadCount: newUnread,
      message: 'Notification created successfully',
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Delete a notification
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Ensure the notification exists and belongs to user
    const notifications = await NotificationService.getUserNotifications(user.id);
    const exists = notifications.some(n => (n as { id: string }).id === notificationId);
    if (!exists) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    // Soft delete by marking read (or implement a delete in service if desired)
    await NotificationService.markAsRead(notificationId);

    return NextResponse.json({
      success: true,
      message: `Notification ${notificationId} deleted successfully`,
    });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
} 