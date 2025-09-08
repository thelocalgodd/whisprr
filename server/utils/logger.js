import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN', 
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'INFO';
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      ...meta
    };
    return JSON.stringify(logEntry);
  }

  writeToFile(level, formattedMessage) {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `${level.toLowerCase()}-${date}.log`;
    const filepath = path.join(logsDir, filename);

    fs.appendFileSync(filepath, formattedMessage + '\n');
  }

  shouldLog(level) {
    const levels = Object.keys(LOG_LEVELS);
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    
    return requestedLevelIndex <= currentLevelIndex;
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output with colors
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[37m'  // White
    };
    
    const resetColor = '\x1b[0m';
    console.log(`${colors[level]}${formattedMessage}${resetColor}`);

    // Write to file
    this.writeToFile(level, formattedMessage);

    // Also write to combined log
    this.writeToFile('combined', formattedMessage);
  }

  error(message, meta = {}) {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }

  warn(message, meta = {}) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  info(message, meta = {}) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  debug(message, meta = {}) {
    this.log(LOG_LEVELS.DEBUG, message, meta);
  }

  // Request logging middleware
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();
      const originalSend = res.send;

      res.send = function(body) {
        const duration = Date.now() - start;
        
        logger.info('HTTP Request', {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          userId: req.user?.userId,
          contentLength: body?.length
        });

        originalSend.call(this, body);
      };

      next();
    };
  }

  // Socket logging
  socketLog(event, data = {}) {
    this.info('Socket Event', {
      event,
      ...data,
      type: 'socket'
    });
  }

  // Database operation logging
  dbLog(operation, collection, query = {}, duration = null) {
    this.debug('Database Operation', {
      operation,
      collection,
      query,
      duration: duration ? `${duration}ms` : null,
      type: 'database'
    });
  }

  // Security logging
  securityLog(event, details = {}) {
    this.warn('Security Event', {
      event,
      ...details,
      type: 'security'
    });
  }

  // Performance logging
  performanceLog(operation, duration, details = {}) {
    const level = duration > 1000 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
    this.log(level, 'Performance Metric', {
      operation,
      duration: `${duration}ms`,
      ...details,
      type: 'performance'
    });
  }

  // Log cleanup - remove old log files
  cleanupLogs(daysToKeep = 7) {
    try {
      const files = fs.readdirSync(logsDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      files.forEach(file => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          this.info(`Cleaned up old log file: ${file}`);
        }
      });
    } catch (error) {
      this.error('Error cleaning up logs', { error: error.message });
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Performance monitoring decorator
export const monitor = (target, propertyKey, descriptor) => {
  const originalMethod = descriptor.value;

  descriptor.value = async function(...args) {
    const start = Date.now();
    try {
      const result = await originalMethod.apply(this, args);
      const duration = Date.now() - start;
      logger.performanceLog(`${target.constructor.name}.${propertyKey}`, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`Error in ${target.constructor.name}.${propertyKey}`, {
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  };

  return descriptor;
};

// Rate limiting logging
export const logRateLimit = (req, res, next) => {
  logger.warn('Rate Limit Exceeded', {
    ip: req.ip,
    url: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent')
  });
  next();
};

// Graceful shutdown logging
export const logGracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
};

// Initialize log cleanup on startup
setTimeout(() => {
  logger.cleanupLogs();
}, 5000); // Clean up after 5 seconds of startup

export default logger;