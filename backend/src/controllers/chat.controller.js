const suzuService = require("../services/groq.service");
const convService = require("../services/conversation.service");
const logger = require("../config/logger");

const sendMessage = async (req, res, next) => {
  try {
    const { message, conversationId, attachments } = req.body;
    if (!message?.trim() && !attachments?.length) return res.status(400).json({ success: false, error: "message required" });

    let convId = conversationId;
    if (!convId || !convService.get(convId)) { const c = convService.create(); convId = c.id; }

    // Build user content — text + optional images
    const userContent = suzuService.buildUserContent(message?.trim() || "", attachments || []);
    convService.appendMessage(convId, "user", typeof userContent === "string" ? userContent : message?.trim() || "");

    const conv = convService.get(convId);
    const memories = convService.getMemories();

    // Build history — replace last user message with rich content if images present
    const history = conv.messages.map((m, i) => {
      if (i === conv.messages.length - 1 && m.role === "user" && Array.isArray(userContent)) {
        return { role: "user", content: userContent };
      }
      return { role: m.role, content: m.content };
    });

    logger.info(`Calling Suzu service with ${history.length} messages`);
    const result = await suzuService.chat(history, memories);
    logger.info("Suzu service raw result:", result);

    const reply = result?.reply || result?.content || result?.text;
    if (!reply) throw new Error("No reply returned from suzuService.chat()");

    convService.appendMessage(convId, "assistant", reply);
    if (conv.messages.length <= 2) {
      const titleInput = typeof message === "string" ? message.trim() : "New conversation";
      const t = await suzuService.generateTitle(titleInput);
      convService.rename(convId, t);
    }

    res.json({ success: true, conversationId: convId, reply, messageCount: conv.messages.length });
  } catch (err) { next(err); }
};

const streamMessage = async (req, res, next) => {
  try {
    const { message, conversationId, attachments } = req.body;
    if (!message?.trim() && !attachments?.length) return res.status(400).json({ success: false, error: "message required" });

    let convId = conversationId;
    if (!convId || !convService.get(convId)) { const c = convService.create(); convId = c.id; }

    const userContent = suzuService.buildUserContent(message?.trim() || "", attachments || []);
    convService.appendMessage(convId, "user", typeof userContent === "string" ? userContent : message?.trim() || "");

    const conv = convService.get(convId);
    const memories = convService.getMemories();

    const history = conv.messages.map((m, i) => {
      if (i === conv.messages.length - 1 && m.role === "user" && Array.isArray(userContent)) {
        return { role: "user", content: userContent };
      }
      return { role: m.role, content: m.content };
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Conversation-Id", convId);
    res.flushHeaders();

    let fullReply = "";
    await suzuService.chatStream(history, (chunk) => {
      fullReply += chunk;
      res.write(`data: ${JSON.stringify({ type: "delta", text: chunk })}\n\n`);
    }, memories);

    convService.appendMessage(convId, "assistant", fullReply);
    if (conv.messages.length <= 2) {
      const titleInput = typeof message === "string" ? message.trim() : "New conversation";
      const t = await suzuService.generateTitle(titleInput);
      convService.rename(convId, t);
    }

    res.write(`data: ${JSON.stringify({ type: "done", conversationId: convId })}\n\n`);
    res.end();
  } catch (err) {
    if (!res.headersSent) return next(err);
    res.write(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`);
    res.end();
  }
};

const listConversations = (req, res) => {
  const list = req.query.q ? convService.search(req.query.q) : convService.listAll();
  res.json({ success: true, conversations: list });
};

const newConversation = (req, res) => {
  const conv = convService.create(req.body?.title || "नई बातचीत");
  res.json({ success: true, conversation: conv });
};

const getConversation = (req, res) => {
  const conv = convService.get(req.params.id);
  if (!conv) return res.status(404).json({ success: false, error: "Not found" });
  res.json({ success: true, conversation: conv });
};

const renameConversation = (req, res) => {
  const { title } = req.body;
  if (!title?.trim()) return res.status(400).json({ success: false, error: "title required" });
  const conv = convService.rename(req.params.id, title.trim());
  if (!conv) return res.status(404).json({ success: false, error: "Not found" });
  res.json({ success: true, conversation: conv });
};

const pinConversation = (req, res) => {
  const result = convService.togglePin(req.params.id);
  if (!result) return res.status(404).json({ success: false, error: "Not found" });
  res.json({ success: true, ...result });
};

const deleteConversation = (req, res) => { convService.remove(req.params.id); res.json({ success: true }); };
const getMemories = (req, res) => res.json({ success: true, memories: convService.getMemories() });
const addMemory = (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ success: false, error: "text required" });
  res.json({ success: true, memory: convService.addMemory(text.trim()) });
};
const deleteMemory = (req, res) => { convService.deleteMemory(req.params.id); res.json({ success: true }); };

module.exports = {
  sendMessage, streamMessage, listConversations, newConversation,
  getConversation, renameConversation, pinConversation, deleteConversation,
  getMemories, addMemory, deleteMemory
};