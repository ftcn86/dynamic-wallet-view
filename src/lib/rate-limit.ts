const buckets = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(req: Request, key: string, limit: number, windowMs: number) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0] || 'unknown';
  const k = `${key}:${ip}`;
  const now = Date.now();
  const entry = buckets.get(k);
  if (!entry || entry.resetAt < now) {
    buckets.set(k, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (entry.count >= limit) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  }
  entry.count += 1;
}


