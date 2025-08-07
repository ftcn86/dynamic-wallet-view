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


