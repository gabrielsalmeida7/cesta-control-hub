type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  userId?: string;
  action?: string;
}

const sanitizeData = (data: unknown): unknown => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'auth'];

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some((sk) => lowerKey.includes(sk));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && lowerKey.includes('email')) {
      const emailParts = value.split('@');
      if (emailParts.length === 2) {
        const username = emailParts[0];
        const domain = emailParts[1];
        const maskedUsername =
          username.length > 1
            ? `${username[0]}${'*'.repeat(Math.min(username.length - 1, 3))}`
            : '*';
        sanitized[key] = `${maskedUsername}@${domain}`;
      } else {
        sanitized[key] = value;
      }
    } else {
      sanitized[key] = sanitizeData(value);
    }
  }

  return sanitized;
};

const formatLogEntry = (entry: LogEntry): string => {
  const parts = [`[${entry.timestamp}]`, `[${entry.level.toUpperCase()}]`, entry.message];

  if (entry.action) {
    parts.push(`[ACTION: ${entry.action}]`);
  }

  if (entry.userId) {
    parts.push(`[USER: ${entry.userId}]`);
  }

  if (entry.context) {
    const sanitizedContext = sanitizeData(entry.context);
    parts.push(JSON.stringify(sanitizedContext));
  }

  return parts.join(' ');
};

class Logger {
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    action?: string,
    userId?: string
  ) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context ? (sanitizeData(context) as Record<string, unknown>) : undefined,
      action,
      userId,
    };

    if (!__DEV__ && (level === 'debug' || level === 'info')) {
      return;
    }

    const formatted = formatLogEntry(entry);

    switch (level) {
      case 'debug':
        if (__DEV__) {
          console.debug(formatted);
        }
        break;
      case 'info':
        if (__DEV__) {
          console.info(formatted);
        }
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
      default: {
        const _exhaustive: never = level;
        return _exhaustive;
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>, action?: string, userId?: string) {
    this.log('debug', message, context, action, userId);
  }

  info(message: string, context?: Record<string, unknown>, action?: string, userId?: string) {
    this.log('info', message, context, action, userId);
  }

  warn(message: string, context?: Record<string, unknown>, action?: string, userId?: string) {
    this.log('warn', message, context, action, userId);
  }

  error(message: string, context?: Record<string, unknown>, action?: string, userId?: string) {
    this.log('error', message, context, action, userId);
  }

  audit(action: string, userId: string, details?: Record<string, unknown>) {
    this.info(`AUDIT: ${action}`, details, action, userId);
  }
}

export const logger = new Logger();
