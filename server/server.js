require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { initFirebase } = require("./config/firebase");

const app = express();

// Connect to database and set up Firebase before anything else
connectDB();
initFirebase();

// Middleware — parse JSON bodies and allow cross-origin requests from the frontend
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

// All our routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/tasks", require("./routes/tasks"));

// Quick health check — useful for verifying the server is up
app.get("/api/health", (req, res) => res.json({ status: "ok", message: "Ethara API is running" }));

// Catch-all for routes that don't exist
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Global error handler — catches anything thrown inside route handlers
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
