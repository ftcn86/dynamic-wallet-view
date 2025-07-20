import { NextRequest, NextResponse } from 'next/server';
import type { Notification, NotificationType } from '@/data/schemas';

// In-memory storage for notifications (in production, this would be a database)
// eslint-disable-next-line prefer-const
let notifications: Notification[] = [
  {
    id: 'notif_001',
    type: 'node_update',
    title: 'Software Update Available',
    description: 'Your node is running v1.2.3, but v1.2.4 is available.',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    read: true,
    link: '/dashboard/node'
  },
  {
    id: 'notif_002',
    type: 'badge_earned',
    title: 'New Badge Earned!',
    description: 'You\'ve earned the "Active Team Leader" badge. Great leadership!',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    read: true,
    link: '/dashboard?tab=achievements'
  },
  {
    id: 'notif_003',
    type: 'team_update',
    title: 'Team Member KYC Verified',
    description: 'Your team member, Bob Miner, has completed their KYC verification.',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    read: true,
    link: '/dashboard/team'
  },
  {
    id: 'notif_004',
    type: 'announcement',
    title: 'Community Donation Goal Met!',
    description: 'Thanks to your support, we\'ve reached our monthly server cost goal.',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    read: true,
    link: '/dashboard/donate'
  },
  {
    id: 'notif_005',
    type: 'team_message',
    title: 'Message from your Team Leader',
    description: 'Great work this week everyone! Let\'s keep up the momentum.',
    date: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // 26 hours ago
    read: true,
    link: '/dashboard/team'
  },
];

/**
 * GET /api/notifications
 * Get all notifications for the current user
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

    // Return notifications sorted by date (newest first)
    const sortedNotifications = notifications.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
      success: true,
      notifications: sortedNotifications,
      count: sortedNotifications.length,
      unreadCount: sortedNotifications.filter(n => !n.read).length,
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
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
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
      link,
    };

    notifications.unshift(newNotification); // Add to beginning of array

    console.log('Notification created:', newNotification);

    return NextResponse.json({
      success: true,
      notification: newNotification,
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
} 