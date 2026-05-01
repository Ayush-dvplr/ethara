const User = require("../models/User");

// GET /api/users
// Admin brownie feature — see everyone who's signed up, useful for assigning to projects
const getAllUsers = async (req, res) => {
  try {
    // Never send passwords back, even hashed ones
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ users, count: users.length });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch users" });
  }
};

// GET /api/users/:id
// Get a specific user's public info
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch user" });
  }
};

// PATCH /api/users/:id/role
// Admin can promote a member to admin or demote back to member
const updateUserRole = async (req, res) => {
  const { role } = req.body;

  if (!["admin", "member"].includes(role)) {
    return res.status(400).json({ message: "Role must be either 'admin' or 'member'" });
  }

  try {
    // Admin can't change their own role — prevents accidental self-lockout
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't change your own role" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: `${user.name} is now a ${role}`, user });
  } catch (err) {
    res.status(500).json({ message: "Could not update role" });
  }
};

// PUT /api/users/profile
// Any logged-in user can update their own name and avatar
const updateProfile = async (req, res) => {
  const { name, avatar } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...(name && { name }), ...(avatar && { avatar }) },
      { new: true }
    ).select("-password");

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Could not update profile" });
  }
};

module.exports = { getAllUsers, getUserById, updateUserRole, updateProfile };
