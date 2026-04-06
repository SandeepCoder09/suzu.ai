const rateLimit = require("express-rate-limit");
const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests — please wait a moment." },
});
module.exports = { rateLimiter };