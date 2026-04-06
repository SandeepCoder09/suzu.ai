const express = require("express");
const router = express.Router();
const sessionService = require("../services/session.service");

// GET /api/health
router.get("/", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeSessions: sessionService.size(),
    environment: process.env.NODE_ENV || "development",
  });
});

module.exports = router;
