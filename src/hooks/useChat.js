import { useState, useCallback } from "react";
import { sendChatMessage } from "../services/api";

export default function useChat(conversationId, setConversationId) {
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);

  const loadMessages = useCallback((msgs) => {
    setMessages(msgs.map((m, i) => ({
      id: i,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      attachments: m.attachments || [],
    })));
  }, []);

  // attachments = array of {file, isImage, dataUrl, textContent} objects
  const sendMessage = useCallback(async (text, attachments, onReply) => {
    if (!text?.trim() && !attachments?.length) return;
    setError(null);

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: text?.trim() || "",
      timestamp: new Date().toISOString(),
      attachments: attachments || [],
    };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const data = await sendChatMessage(text?.trim() || "", conversationId);
      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
      }
      const assistantMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toISOString(),
        attachments: [],
      };
      setMessages(prev => [...prev, assistantMsg]);
      onReply?.(data.reply);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsThinking(false);
    }
  }, [conversationId, setConversationId]);


  const injectMessage = useCallback((userText, assistantText) => {
    const now = new Date().toISOString();
    setMessages(prev => [
      ...prev,
      { id: Date.now(), role: "user", content: userText, timestamp: now, attachments: [] },
      { id: Date.now() + 1, role: "assistant", content: assistantText, timestamp: now, attachments: [] },
    ]);
  }, []);

  const clearMessages = useCallback(async () => {
    setMessages([]); setError(null);
    try { if (conversationId) await clearSession(conversationId); } catch (_) { }
  }, [conversationId]);

  return { messages, isThinking, error, sendMessage, clearMessages, injectMessage, loadMessages };
}