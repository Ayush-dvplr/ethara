const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById, updateUserRole, updateProfile } = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/auth");

// All user routes require being logged in
router.use(protect);

router.get("/", adminOnly, getAllUsers);          // admin brownie feature
router.get("/:id", getUserById);                  // any user can look up another
router.patch("/:id/role", adminOnly, updateUserRole); // admin-only
router.put("/profile/me", updateProfile);         // any user updates their own profile

module.exports = router;
