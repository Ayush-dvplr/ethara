const mongoose = require("mongoose");

// Connect to MongoDB — we call this once when the server starts
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1); // kill the server if DB doesn't connect — no point running without it
  }
};

module.exports = connectDB;
