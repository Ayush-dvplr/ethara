const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify that the request has a valid JWT token
// Attaches the full user object to req.user so controllers can use it
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token — please log in" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) return res.status(401).json({ message: "User no longer exists" });

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token is invalid or expired" });
  }
};

// Only admins can access the route — must be used AFTER protect middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only — you don't have permission for this" });
  }
  next();
};

module.exports = { protect, adminOnly };
