/* eslint-disable no-console */
/**
 * AutoDock Structured Logger with Sensitive Field Redaction.
 * Enforces the rule that credentials, tokens, and bank account numbers are never logged.
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'accountNumber',
  'cvv',
  'storageKey',
]);

function sanitize(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  const cleanObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key)) {
      cleanObj[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      cleanObj[key] = sanitize(value);
    } else {
      cleanObj[key] = value;
    }
  }
  return cleanObj;
}

export const logger = {
  info: (message: string, meta?: unknown): void => {
    const timestamp = new Date().toISOString();
    if (meta !== undefined) {
      console.log(`[${timestamp}] [INFO] ${message}`, JSON.stringify(sanitize(meta)));
    } else {
      console.log(`[${timestamp}] [INFO] ${message}`);
    }
  },
  warn: (message: string, meta?: unknown): void => {
    const timestamp = new Date().toISOString();
    if (meta !== undefined) {
      console.warn(`[${timestamp}] [WARN] ${message}`, JSON.stringify(sanitize(meta)));
    } else {
      console.warn(`[${timestamp}] [WARN] ${message}`);
    }
  },
  error: (message: string, error?: unknown): void => {
    const timestamp = new Date().toISOString();
    if (error !== undefined) {
      console.error(`[${timestamp}] [ERROR] ${message}`, error instanceof Error ? error.message : sanitize(error));
    } else {
      console.error(`[${timestamp}] [ERROR] ${message}`);
    }
  },
  debug: (message: string, meta?: unknown): void => {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      if (meta !== undefined) {
        console.debug(`[${timestamp}] [DEBUG] ${message}`, JSON.stringify(sanitize(meta)));
      } else {
        console.debug(`[${timestamp}] [DEBUG] ${message}`);
      }
    }
  },
};
