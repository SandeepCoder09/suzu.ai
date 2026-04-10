const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) return res.status(400).json({ success: false, error: "No credential provided" });

        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture: avatar } = payload;

        // Upsert user in MongoDB
        const user = await User.findOneAndUpdate(
            { googleId },
            { googleId, email, name, avatar, lastLogin: new Date() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Sign JWT
        const token = jwt.sign(
            { id: user._id, googleId, email, name, avatar },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        res.json({
            success: true,
            token,
            user: { id: user._id, name, email, avatar },
        });
    } catch (err) {
        console.error("[Auth] Google OAuth error:", err.message);
        res.status(401).json({ success: false, error: "Invalid Google token" });
    }
};

const verifyToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ success: false, error: "No token" });

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-__v");
        if (!user) return res.status(401).json({ success: false, error: "User not found" });

        res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
    } catch {
        res.status(401).json({ success: false, error: "Invalid token" });
    }
};

module.exports = { googleAuth, verifyToken };