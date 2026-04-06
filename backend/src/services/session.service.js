/**
 * In-memory session store.
 * Each session holds a conversation history array.
 * Sessions expire after TTL_MS of inactivity.
 */

const logger = require("../config/logger");

const TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_SESSIONS = 500;

const sessions = new Map(); // sessionId → { messages: [], lastActive: Date }

const get = (sessionId) => {
  const session = sessions.get(sessionId);
  if (!session) return null;
  session.lastActive = Date.now();
  return session;
};

const getOrCreate = (sessionId) => {
  let session = sessions.get(sessionId);
  if (!session) {
    if (sessions.size >= MAX_SESSIONS) {
      pruneOldest();
    }
    session = { messages: [], lastActive: Date.now(), createdAt: Date.now() };
    sessions.set(sessionId, session);
    logger.info(`Session created: ${sessionId}`);
  } else {
    session.lastActive = Date.now();
  }
  return session;
};

const appendMessage = (sessionId, role, content) => {
  const session = getOrCreate(sessionId);
  session.messages.push({ role, content });
  return session;
};

const clear = (sessionId) => {
  const existed = sessions.delete(sessionId);
  if (existed) logger.info(`Session cleared: ${sessionId}`);
  return existed;
};

const pruneOldest = () => {
  const sorted = [...sessions.entries()].sort((a, b) => a[1].lastActive - b[1].lastActive);
  const toRemove = sorted.slice(0, Math.floor(MAX_SESSIONS / 4));
  toRemove.forEach(([id]) => sessions.delete(id));
  logger.info(`Pruned ${toRemove.length} expired sessions`);
};

// Background cleanup every 15 minutes
setInterval(() => {
  const now = Date.now();
  let removed = 0;
  for (const [id, session] of sessions) {
    if (now - session.lastActive > TTL_MS) {
      sessions.delete(id);
      removed++;
    }
  }
  if (removed > 0) logger.info(`Session GC: removed ${removed} expired sessions`);
}, 15 * 60 * 1000);

module.exports = { get, getOrCreate, appendMessage, clear, size: () => sessions.size };
