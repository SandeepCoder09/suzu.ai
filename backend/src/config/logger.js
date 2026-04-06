// Simple console logger — no winston dependency needed
const logger = {
  info: (...args) => console.log("[INFO]", ...args),
  error: (...args) => console.error("[ERROR]", ...args),
  warn: (...args) => console.warn("[WARN]", ...args),
  http: (...args) => console.log("[HTTP]", ...args),
  debug: (...args) => console.log("[DEBUG]", ...args),
};
module.exports = logger;