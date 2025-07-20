import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/team/broadcast
 * Send a broadcast message to all team members
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

    const { message } = await request.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Create a notification for the broadcast message
    // In a real implementation, this would create notifications for all team members
    const newNotification = {
      id: `notif_${Date.now()}`,
      type: 'team_message',
      title: 'Message from your Team Leader',
      description: message,
      date: new Date().toISOString(),
      read: false,
      link: '/dashboard/team',
    };

    // Add to notifications array (in production, this would be database)
    // For now, we'll add it to the notifications array in the notifications API
    console.log('Broadcast message sent:', message);
    console.log('Notification created for broadcast:', newNotification);

    return NextResponse.json({
      success: true,
      message: 'Broadcast message sent successfully',
      notification: newNotification,
      recipients: 5, // Mock number of team members
    });
  } catch (error) {
    console.error('Failed to send broadcast message:', error);
    return NextResponse.json(
      { error: 'Failed to send broadcast message' },
      { status: 500 }
    );
  }
} 