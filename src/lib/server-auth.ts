import prisma from '@/lib/db';
import { NextRequest } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';

export interface SessionAndPiUser {
  dbUserId: string;
  accessToken: string;
  piUser: { uid: string; username: string };
}

// Unified helper to enforce: valid session cookie, DB user with accessToken, and Pi API verification
export async function requireSessionAndPiUser(request: NextRequest): Promise<SessionAndPiUser> {
  const sessionToken = request.cookies.get('session-token')?.value;
  if (!sessionToken) {
    throw new Error('No session');
  }

  const session = await prisma.userSession.findFirst({
    where: { sessionToken, isActive: true, expiresAt: { gt: new Date() } },
    include: { user: true }
  });
  if (!session || !session.user?.accessToken) {
    throw new Error('Invalid session');
  }

  const pi = getPiPlatformAPIClient();
  const piUser = await pi.verifyUser(session.user.accessToken);
  return { dbUserId: session.user.id, accessToken: session.user.accessToken, piUser: { uid: piUser.uid, username: piUser.username } };
}


