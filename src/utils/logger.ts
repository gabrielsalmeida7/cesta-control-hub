/**
 * Sistema de logging estruturado
 * Remove informações sensíveis e fornece diferentes níveis de log
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  userId?: string;
  action?: string;
}

/**
 * Remove informações sensíveis de objetos antes de logar
 */
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
    const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && lowerKey.includes('email')) {
      // Mascarar email parcialmente: user@example.com -> u***@example.com
      const emailParts = value.split('@');
      if (emailParts.length === 2) {
        const username = emailParts[0];
        const domain = emailParts[1];
        const maskedUsername = username.length > 1 
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

/**
 * Formata entrada de log
 */
const formatLogEntry = (entry: LogEntry): string => {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
    entry.message,
  ];

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

/**
 * Logger principal
 */
class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, action?: string, userId?: string) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context ? sanitizeData(context) as Record<string, unknown> : undefined,
      action,
      userId,
    };

    // Em produção, apenas logar errors e warns
    if (this.isProduction && (level === 'debug' || level === 'info')) {
      return;
    }

    const formatted = formatLogEntry(entry);

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formatted);
        }
        break;
      case 'info':
        if (this.isDevelopment) {
          console.info(formatted);
        }
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        // Em produção, poderia enviar para serviço de logging (Sentry, etc.)
        break;
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

  /**
   * Log de ações críticas para auditoria
   */
  audit(action: string, userId: string, details?: Record<string, unknown>) {
    this.info(`AUDIT: ${action}`, details, action, userId);
    // Em produção, isso deveria ser enviado para uma tabela de auditoria no Supabase
  }
}

export const logger = new Logger();

