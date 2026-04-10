const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const connectDB = require("./config/db");
const chatRoutes = require("./routes/chat.routes");
const authRoutes = require("./routes/auth.routes");
const healthRoutes = require("./routes/health.routes");
const { errorHandler } = require("./middleware/errorHandler");
const { rateLimiter } = require("./middleware/rateLimiter");

// Connect to MongoDB
connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json({ limit: "10mb" })); // increased for image uploads
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

app.use("/api/", rateLimiter);
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);   // ← Google OAuth routes
app.use("/api/chat", chatRoutes);

app.use((req, res) =>
  res.status(404).json({ success: false, error: "Route not found" })
);

app.use(errorHandler);

module.exports = app;