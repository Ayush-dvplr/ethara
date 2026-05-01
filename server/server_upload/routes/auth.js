const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { register, login, googleLogin, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// Validation rules for registration
const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

// Validation rules for email/password login
const loginRules = [
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

router.post("/register", registerRules, register);
router.post("/login", loginRules, login);
router.post("/google", googleLogin);
router.get("/me", protect, getMe); // protected — need a valid token

module.exports = router;
