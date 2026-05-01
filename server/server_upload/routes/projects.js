const express = require("express");
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require("../controllers/projectController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect); // all project routes require login

router.get("/", getProjects);                              // filtered by role in controller
router.get("/:id", getProjectById);                        // members can only see their own
router.post("/", adminOnly, createProject);
router.put("/:id", adminOnly, updateProject);
router.delete("/:id", adminOnly, deleteProject);
router.post("/:id/members", adminOnly, addMember);
router.delete("/:id/members/:userId", adminOnly, removeMember);

module.exports = router;
