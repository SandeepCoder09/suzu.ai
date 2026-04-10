const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            dbName: "suzu-ai",
        });
        isConnected = true;
        console.log(`✦ MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        console.error("[MongoDB] Connection error:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;