export function isUidWhitelisted(uid: string | undefined | null): boolean {
  if (!uid) return false;
  const raw = process.env.ADMIN_UIDS || '';
  const list = raw.split(',').map(s => s.trim()).filter(Boolean);
  return list.includes(uid);
}


