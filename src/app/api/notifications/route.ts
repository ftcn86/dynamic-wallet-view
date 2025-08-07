import { NextRequest, NextResponse } from 'next/server';
import type { Notification, NotificationType } from '@/data/schemas';
import { getUserFromSession } from '@/lib/session';

// In-memory storage for notifications (in production, this would be a database)
const notifications: Notification[] = [
  {
    id: 'notif_1',
    type: 'badge_earned',
    title: 'Welcome Badge Earned!',
    description: 'Congratulations! You\'ve earned your first badge.',
    date: new Date().toISOString(),
    read: false,
    link: '/dashboard/badges'
  },
  {
    id: 'notif_2',
    type: 'team_update',
    title: 'New Team Member',
    description: 'JohnDoe has joined your earning team!',
    date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    read: false,
    link: '/dashboard/team'
  },
  {
    id: 'notif_3',
    type: 'node_update',
    title: 'Node Status Update',
    description: 'Your Pi Node is now online and running smoothly.',
    date: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    read: true,
    link: '/dashboard/node'
  },
  {
    id: 'notif_4',
    type: 'announcement',
    title: 'App Update Available',
    description: 'A new version of Dynamic Wallet View is available with exciting features!',
    date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    read: false,
    link: '/dashboard/settings'
  },
  {
    id: 'notif_5',
    type: 'team_message',
    title: 'Team Message',
    description: 'Great work team! We\'ve reached our weekly mining goal.',
    date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    read: true,
    link: '/dashboard/team'
  }
];

/**
 * GET /api/notifications
 * Get all notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
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
    const { UserService, NotificationService } = await import('@/services/databaseService');

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
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        console.log(`Notification ${notificationId} marked as read`);
        return NextResponse.json({
          success: true,
          message: `Notification ${notificationId} marked as read`,
        });
      } else {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }
    }

    // Handle mark all as read action
    if (action === 'markAllAsRead') {
      notifications.forEach(n => n.read = true);
      console.log('All notifications marked as read');
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

    const newNotification: Notification = {
      id: `notif_${Date.now()}`,
      type: type as NotificationType,
      title,
      description,
      date: new Date().toISOString(),
      read: false,
      link: link || null
    };

    notifications.unshift(newNotification);
    console.log('New notification created:', newNotification);

    return NextResponse.json({
      success: true,
      notification: newNotification,
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

    const notificationIndex = notifications.findIndex(n => n.id === notificationId);
    if (notificationIndex === -1) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    notifications.splice(notificationIndex, 1);
    console.log(`Notification ${notificationId} deleted`);

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