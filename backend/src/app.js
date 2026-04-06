const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const chatRoutes = require("./routes/chat.routes");
const healthRoutes = require("./routes/health.routes");
const { errorHandler } = require("./middleware/errorHandler");
const { rateLimiter } = require("./middleware/rateLimiter");

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Simple request logger (no morgan needed)
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

app.use("/api/", rateLimiter);
app.use("/api/health", healthRoutes);
app.use("/api/chat", chatRoutes);

app.use((req, res) => res.status(404).json({ success: false, error: "Route not found" }));
app.use(errorHandler);

module.exports = app;