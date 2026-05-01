const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const { getAuth } = require("../config/firebase");

// Helper — create a signed JWT for a user
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Helper — build the response object we send back after login/register
const authResponse = (user, res, statusCode = 200) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
};

// POST /api/auth/register
// Anyone can register — they start as a member
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "An account with this email already exists" });

    const user = await User.create({ name, email, password });
    authResponse(user, res, 201);
  } catch (err) {
    res.status(500).json({ message: "Registration failed — please try again" });
  }
};

// POST /api/auth/login
// Email + password login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    authResponse(user, res);
  } catch (err) {
    res.status(500).json({ message: "Login failed — please try again" });
  }
};

// POST /api/auth/google
const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) return res.status(400).json({ message: "No Google token provided" });

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decoded;

    let user = await User.findOne({ email });

    if (user) {
      // Existing user — update their Google ID and avatar if they didn't have one before
      if (!user.googleId) user.googleId = uid;
      if (!user.avatar && picture) user.avatar = picture;
      await user.save();
    } else {
      // New user — create their account with Google info
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        googleId: uid,
        avatar: picture || null,
        // No password — they log in via Google
      });
    }

    authResponse(user, res);
  } catch (err) {
    // Log the full error code too — Firebase throws specific codes like auth/argument-error
    console.error("Google auth error:", err.code || "", err.message);
    res.status(401).json({ message: "Google sign-in failed — token may be invalid or expired" });
  }
};

// GET /api/auth/me
// Returns the currently logged-in user's info (used on app load to restore session)
const getMe = async (req, res) => {
  res.json({
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
    },
  });
};

module.exports = { register, login, googleLogin, getMe };
