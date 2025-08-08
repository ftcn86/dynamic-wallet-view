import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { requireSessionAndPiUser } from '@/lib/server-auth';
import { FeedbackService, NotificationService } from '@/services/databaseService';
import { isUidWhitelisted } from '@/lib/admin';

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
    if (text.length < 5 || text.length > 1000) return NextResponse.json({ error: 'Message must be between 5 and 1000 characters.' }, { status: 400 });

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

export async function GET(request: NextRequest) {
  try {
    await rateLimit(request as unknown as Request, 'feedback:get', 30, 60_000);
    // Admin-only listing
    let piUser;
    try {
      ({ piUser } = await requireSessionAndPiUser(request));
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isUidWhitelisted(piUser.uid)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;
    const items = await FeedbackService.listFeedback(status || undefined);
    return NextResponse.json({ success: true, items });
  } catch {
    return NextResponse.json({ error: 'Failed to list feedback' }, { status: 500 });
  }
}


