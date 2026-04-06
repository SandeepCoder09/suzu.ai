const validateMessage = (req, res, next) => {
  const { message } = req.body;
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: "'message' field is required and must be a non-empty string.",
    });
  }
  req.body.message = message.trim();
  next();
};

module.exports = { validateMessage };
