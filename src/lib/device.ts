import { NextRequest } from 'next/server';
import crypto from 'crypto';

export function computeDeviceHashFromRequest(request: NextRequest): string {
  const ua = request.headers.get('user-agent') || '';
  const lang = request.headers.get('accept-language') || '';
  const xff = request.headers.get('x-forwarded-for') || '';
  const ip = xff.split(',')[0].trim();
  const raw = `${ua}||${lang}||${ip}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function isDeviceWhitelisted(hash: string | undefined | null): boolean {
  if (!hash) return false;
  const raw = process.env.ADMIN_DEVICE_HASHES || '';
  if (!raw) return true; // if not set, don't enforce device whitelist
  const list = raw.split(',').map(s => s.trim()).filter(Boolean);
  return list.includes(hash);
}

export function isDeviceEnforced(): boolean {
  const raw = process.env.ADMIN_DEVICE_HASHES || '';
  return raw.trim().length > 0;
}


