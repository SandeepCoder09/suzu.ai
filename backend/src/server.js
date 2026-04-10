require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db"); // <-- ADD THIS

const PORT = process.env.PORT || 3001;

// connect database first
connectDB();

const server = app.listen(PORT, () => {
  console.log(`✦ SUZU Backend running on http://localhost:${PORT}`);
  console.log(`  Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(
    `  CORS Origin : ${process.env.CORS_ORIGIN || "http://localhost:5173"}`
  );
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});

process.on("unhandledRejection", (reason) => {
  console.error("[Suzu] Unhandled Rejection:", reason);
});