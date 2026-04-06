const errorHandler = (err, req, res, next) => {
  console.error("[Suzu Error]", err.message, err.stack?.split("\n")[1] || "");
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
};
module.exports = { errorHandler };