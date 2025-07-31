/**
 * Session Management System
 * 
 * This module handles user sessions using JWT tokens and database storage
 * instead of localStorage for better security and reliability.
 */

import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export interface SessionData {
  sessionId: string;
  userId: string;
  piAccessToken: string;
  piRefreshToken?: string;
  expiresAt: Date;
}

export interface JWTPayload {
  sessionId: string;
  userId: string;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const SESSION_COOKIE_NAME = 'pi-session-token';
const SESSION_DURATION = 24 * 60 * 60; // 24 hours in seconds

/**
 * Create a new user session
 */
export async function createSession(
  userId: string, 
  piAccessToken: string, 
  piRefreshToken?: string
): Promise<{ sessionToken: string; expiresAt: Date }> {
  try {
    const { UserService, SessionService } = await import('@/services/databaseService');
    
    // Create session record in database
    const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000);
    const sessionToken = jwt.sign(
      { userId, sessionId: `session_${Date.now()}` },
      JWT_SECRET,
      { expiresIn: SESSION_DURATION }
    );
    
    const session = await SessionService.createSession({
      userId,
      sessionToken,
      piAccessToken,
      piRefreshToken,
      expiresAt,
    });
    
    return { sessionToken, expiresAt };
  } catch (error) {
    console.error('Failed to create session:', error);
    throw new Error('Session creation failed');
  }
}

/**
 * Validate a session token
 */
export async function validateSession(sessionToken: string): Promise<SessionData | null> {
  try {
    // Verify JWT token
    const decoded = jwt.verify(sessionToken, JWT_SECRET) as JWTPayload;
    
    // Get session from database
    const { SessionService } = await import('@/services/databaseService');
    const session = await SessionService.getSessionByToken(sessionToken);
    
    if (!session || !(session as any).isActive || new Date() > (session as any).expiresAt) {
      return null;
    }
    
    return {
      sessionId: (session as any).id,
      userId: (session as any).userId,
      piAccessToken: (session as any).piAccessToken,
      piRefreshToken: (session as any).piRefreshToken,
      expiresAt: (session as any).expiresAt,
    };
  } catch (error) {
    console.error('Session validation failed:', error);
    return null;
  }
}

/**
 * Get session from request cookies
 */
export async function getSessionFromRequest(request: NextRequest): Promise<SessionData | null> {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  
  if (!sessionToken) {
    return null;
  }
  
  return validateSession(sessionToken);
}

/**
 * Set session cookie in response
 */
export function setSessionCookie(response: NextResponse, sessionToken: string, expiresAt: Date): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
  
  return response;
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

/**
 * Invalidate a session
 */
export async function invalidateSession(sessionToken: string): Promise<void> {
  try {
    const { SessionService } = await import('@/services/databaseService');
    await SessionService.invalidateSession(sessionToken);
  } catch (error) {
    console.error('Failed to invalidate session:', error);
  }
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  try {
    const { SessionService } = await import('@/services/databaseService');
    await SessionService.invalidateAllUserSessions(userId);
  } catch (error) {
    console.error('Failed to invalidate user sessions:', error);
  }
}

/**
 * Refresh a session
 */
export async function refreshSession(sessionToken: string): Promise<{ sessionToken: string; expiresAt: Date } | null> {
  try {
    const session = await validateSession(sessionToken);
    
    if (!session) {
      return null;
    }
    
    // Create new session
    const { sessionToken: newToken, expiresAt } = await createSession(
      session.userId,
      session.piAccessToken,
      session.piRefreshToken
    );
    
    // Invalidate old session
    await invalidateSession(sessionToken);
    
    return { sessionToken: newToken, expiresAt };
  } catch (error) {
    console.error('Failed to refresh session:', error);
    return null;
  }
} 