import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { requireSessionAndPiUser } from '@/lib/server-auth';
import { FeedbackService, NotificationService } from '@/services/databaseService';

export async function POST(request: NextRequest) {
  try {
    await rateLimit(request as unknown as Request, 'feedback:post', 5, 60_000);
    let userId: string | null = null;
    try {
      const { dbUserId } = await requireSessionAndPiUser(request);
      userId = dbUserId;
    } catch {}

    const { type, message, pagePath } = await request.json();
    if (!type || typeof type !== 'string') return NextResponse.json({ error: 'type required' }, { status: 400 });
    const text = String(message || '').trim();
    if (text.length < 10 || text.length > 1000) return NextResponse.json({ error: 'message length 10-1000' }, { status: 400 });

    const ua = request.headers.get('user-agent') || undefined;
    const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;
    // Enforce per-user per-month limit: 10
    if (userId) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const { default: prisma } = await import('@/lib/db');
      const count = await prisma.feedback.count({ where: { userId, createdAt: { gte: monthStart } } });
      if (count >= 10) {
        return NextResponse.json({ error: 'Monthly feedback limit reached' }, { status: 429 });
      }
    }

    const feedback = await FeedbackService.createFeedback(userId, { type, message: text, pagePath, userAgent: ua, appVersion });

    // Notify user (in-app) if logged in
    if (userId) {
      await NotificationService.createNotification(userId, {
        type: 'ANNOUNCEMENT' as any,
        title: 'Feedback received',
        description: 'Thank you! We will review and reply in your Support Inbox if needed.',
        link: '/dashboard/support'
      });
    }
    return NextResponse.json({ success: true, id: feedback.id });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}


