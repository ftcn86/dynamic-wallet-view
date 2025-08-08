/* Simple logging wrapper to centralize output */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function emit(level: LogLevel, message: unknown, ...optional: unknown[]) {
  const prefix = `[${new Date().toISOString()}]`;
  if (level === 'debug') console.debug(prefix, message, ...optional);
  else if (level === 'info') console.info(prefix, message, ...optional);
  else if (level === 'warn') console.warn(prefix, message, ...optional);
  else console.error(prefix, message, ...optional);
}

export const logDebug = (...args: unknown[]) => emit('debug', args[0], ...(args.slice(1)));
export const logInfo = (...args: unknown[]) => emit('info', args[0], ...(args.slice(1)));
export const logWarn = (...args: unknown[]) => emit('warn', args[0], ...(args.slice(1)));
export const logError = (...args: unknown[]) => emit('error', args[0], ...(args.slice(1)));

// Lightweight logging helpers

const isDevelopment = process.env.NODE_ENV === 'development';

export function debug(...args: unknown[]) {
  if (isDevelopment) console.debug(...args);
}

export function log(...args: unknown[]) {
  if (isDevelopment) console.log(...args);
}

export function info(...args: unknown[]) {
  if (isDevelopment) console.info(...args);
}

export function warn(...args: unknown[]) {
  if (isDevelopment) console.warn(...args);
}

export function error(...args: unknown[]) {
  // Always log errors
  console.error(...args);
}


