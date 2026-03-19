const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Generic AI endpoints: cap burst usage to protect quota.
const aiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  message: {
    message: 'Too many AI requests. Please wait before trying again.',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Learning path is the most expensive AI operation.
const learningPathRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  message: {
    message: 'Learning path can only be generated 3 times per hour.',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  aiRateLimit,
  learningPathRateLimit,
};
