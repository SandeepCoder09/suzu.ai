import { useState, useCallback } from "react";
import { sendChatMessage, deleteConversation } from "../services/api";

export default function useChat(conversationId, setConversationId) {
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);

  const loadMessages = useCallback((msgs) => {
    setMessages(msgs.map((m, i) => ({ id: i, role: m.role, content: m.content })));
  }, []);

  const sendMessage = useCallback(async (text, onReply) => {
    if (!text?.trim()) return;
    setError(null);
    const userMsg = { id: Date.now(), role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);
    try {
      const data = await sendChatMessage(text.trim(), conversationId);
      // Update conversationId if backend created a new one
      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
      }
      const assistantMsg = { id: Date.now() + 1, role: "assistant", content: data.reply };
      setMessages(prev => [...prev, assistantMsg]);
      onReply?.(data.reply);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsThinking(false);
    }
  }, [conversationId, setConversationId]);

  // Inject wake word response directly
  const injectMessage = useCallback((userText, assistantText) => {
    setMessages(prev => [
      ...prev,
      { id: Date.now(), role: "user", content: userText },
      { id: Date.now() + 1, role: "assistant", content: assistantText },
    ]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isThinking, error, sendMessage, clearMessages, injectMessage, loadMessages };
}