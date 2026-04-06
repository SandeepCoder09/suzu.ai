import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({ baseURL: BASE, timeout: 30000, headers: { "Content-Type": "application/json" } });

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(new Error(err.response?.data?.error || err.message || "Something went wrong"))
);

// Chat
export const sendChatMessage = (message, conversationId) => api.post("/chat/message", { message, conversationId });
export const streamChatMessage = (message, conversationId, { onChunk, onDone, onError }) => {
  const ctrl = new AbortController();
  fetch(`${BASE}/chat/stream`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, conversationId }), signal: ctrl.signal,
  }).then(async (res) => {
    if (!res.ok) { const e = await res.json().catch(() => ({ error: "Stream failed" })); throw new Error(e.error); }
    const reader = res.body.getReader(); const decoder = new TextDecoder(); let buf = "";
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n\n"); buf = lines.pop();
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try { const p = JSON.parse(line.slice(6)); if (p.type === "delta") onChunk?.(p.text); if (p.type === "done") onDone?.(p); if (p.type === "error") onError?.(new Error(p.error)); } catch (_) { }
        }
      }
    }
  }).catch(err => { if (err.name !== "AbortError") onError?.(err); });
  return () => ctrl.abort();
};

// Conversations
export const listConversations = (q) => api.get("/chat/conversations", { params: q ? { q } : {} });
export const createConversation = (title) => api.post("/chat/conversations", { title });
export const getConversation = (id) => api.get(`/chat/conversations/${id}`);
export const renameConversation = (id, title) => api.patch(`/chat/conversations/${id}/rename`, { title });
export const pinConversation = (id) => api.patch(`/chat/conversations/${id}/pin`);
export const deleteConversation = (id) => api.delete(`/chat/conversations/${id}`);

// Memories
export const getMemories = () => api.get("/chat/memories");
export const addMemory = (text) => api.post("/chat/memories", { text });
export const deleteMemory = (id) => api.delete(`/chat/memories/${id}`);

// Health
export const healthCheck = () => api.get("/health");

export default api;