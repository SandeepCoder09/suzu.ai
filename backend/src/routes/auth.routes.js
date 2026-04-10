const express = require("express");
const { googleAuth, verifyToken } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/google", googleAuth);
router.get("/verify", verifyToken);

module.exports = router;