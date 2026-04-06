const express = require("express");
const router = express.Router();
const c = require("../controllers/chat.controller");
const { validateMessage } = require("../middleware/validate");

// Chat
router.post("/message", validateMessage, c.sendMessage);
router.post("/stream", validateMessage, c.streamMessage);

// Conversations
router.get("/conversations", c.listConversations);
router.post("/conversations", c.newConversation);
router.get("/conversations/:id", c.getConversation);
router.patch("/conversations/:id/rename", c.renameConversation);
router.patch("/conversations/:id/pin", c.pinConversation);
router.delete("/conversations/:id", c.deleteConversation);

// Memories
router.get("/memories", c.getMemories);
router.post("/memories", c.addMemory);
router.delete("/memories/:id", c.deleteMemory);

module.exports = router;