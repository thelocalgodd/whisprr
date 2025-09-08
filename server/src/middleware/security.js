const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss');
const crypto = require('crypto');

const createRateLimiter = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    keyGenerator: (req) => {
      return req.user?._id?.toString() || req.ip;
    }
  });
};

const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each user/IP to 100 requests per windowMs
  'Too many requests, please try again later'
);

const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each user/IP to 5 login attempts per windowMs
  'Too many login attempts, please try again later',
  true
);

const messageLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  30, // limit each user to 30 messages per minute
  'Message rate limit exceeded, please slow down'
);

const uploadLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // limit each user to 10 uploads per hour
  'Upload rate limit exceeded, please try again later'
);

const callLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  20, // limit each user to 20 call initiations per hour
  'Call rate limit exceeded, please try again later'
);

const searchLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  20, // limit each user to 20 searches per minute
  'Search rate limit exceeded, please slow down'
);

const adminLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  50, // limit admin actions to 50 per 5 minutes
  'Admin action rate limit exceeded'
);

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return xss(value);
    } else if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    } else if (value && typeof value === 'object') {
      const sanitized = {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  req.body = sanitizeValue(req.body);
  req.query = sanitizeValue(req.query);
  req.params = sanitizeValue(req.params);
  
  next();
};

const validateContentType = (allowedTypes) => {
  return (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.get('Content-Type');
      
      if (!contentType) {
        return res.status(400).json({ error: 'Content-Type header required' });
      }
      
      const isAllowed = allowedTypes.some(type => 
        contentType.toLowerCase().includes(type.toLowerCase())
      );
      
      if (!isAllowed) {
        return res.status(415).json({ 
          error: 'Unsupported Content-Type',
          allowed: allowedTypes
        });
      }
    }
    
    next();
  };
};

const validateUserAgent = (req, res, next) => {
  const userAgent = req.get('User-Agent');
  
  if (!userAgent) {
    return res.status(400).json({ error: 'User-Agent header required' });
  }
  
  const blockedUserAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ];
  
  const isBlocked = blockedUserAgents.some(pattern => 
    pattern.test(userAgent)
  );
  
  if (isBlocked) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
};

const ipWhitelist = (allowedIPs) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      return res.status(403).json({ 
        error: 'IP not allowed',
        ip: clientIP
      });
    }
    
    next();
  };
};

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.removeHeader('X-Powered-By');
  
  next();
};

const requestId = (req, res, next) => {
  req.requestId = crypto.randomBytes(16).toString('hex');
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?._id,
      timestamp: new Date().toISOString()
    };
    
    if (res.statusCode >= 400) {
      console.error('Request failed:', logData);
    } else if (process.env.NODE_ENV === 'development') {
      console.log('Request completed:', logData);
    }
  });
  
  next();
};

const preventBruteForce = (req, res, next) => {
  const ip = req.ip;
  const userId = req.user?._id;
  const key = userId || ip;
  
  if (!req.app.locals.requestCounts) {
    req.app.locals.requestCounts = new Map();
  }
  
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 200;
  
  const userRequests = req.app.locals.requestCounts.get(key) || { count: 0, resetTime: now + windowMs };
  
  if (now > userRequests.resetTime) {
    userRequests.count = 1;
    userRequests.resetTime = now + windowMs;
  } else {
    userRequests.count++;
  }
  
  req.app.locals.requestCounts.set(key, userRequests);
  
  if (userRequests.count > maxRequests) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
    });
  }
  
  next();
};

const csrfProtection = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const token = req.get('X-CSRF-Token') || req.body.csrfToken;
    const sessionToken = req.session?.csrfToken;
    
    if (!token || !sessionToken || token !== sessionToken) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }
  
  next();
};

const detectSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i
  ];
  
  const checkValue = (value) => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    } else if (Array.isArray(value)) {
      return value.some(checkValue);
    } else if (value && typeof value === 'object') {
      return Object.values(value).some(checkValue);
    }
    return false;
  };
  
  const suspicious = checkValue(req.body) || checkValue(req.query) || checkValue(req.params);
  
  if (suspicious) {
    console.warn('Suspicious activity detected:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      body: req.body,
      query: req.query,
      params: req.params,
      userId: req.user?._id
    });
    
    return res.status(400).json({ error: 'Suspicious request detected' });
  }
  
  next();
};

module.exports = {
  rateLimiters: {
    general: generalLimiter,
    auth: authLimiter,
    message: messageLimiter,
    upload: uploadLimiter,
    call: callLimiter,
    search: searchLimiter,
    admin: adminLimiter
  },
  middleware: {
    helmet: helmetConfig,
    mongoSanitize: mongoSanitize(),
    hpp: hpp(),
    sanitizeInput,
    validateContentType,
    validateUserAgent,
    ipWhitelist,
    securityHeaders,
    requestId,
    requestLogger,
    preventBruteForce,
    csrfProtection,
    detectSuspiciousActivity
  }
};