import session from 'express-session';

/**
 * Session Configuration
 * 
 * Following the official Pi Network demo repository pattern
 * for session-based authentication instead of token-based.
 */

export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'pi-network-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' as const,
  },
  name: 'pi-session',
};

export function createSessionMiddleware() {
  return session(sessionConfig);
} 