const express = require("express");
const router = express.Router();
const {
  getTasks,
  getOverdueTasks,
  getTaskById,
  createTask,
  updateTask,
  updateStatus,
  deleteTask,
  addCheckpoint,
  toggleCheckpoint,
  deleteCheckpoint,
} = require("../controllers/taskController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);

// /overdue MUST come before /:id or Express will match "overdue" as an id param
router.get("/overdue", getOverdueTasks);

router.get("/", getTasks);
router.get("/:id", getTaskById);
router.post("/", adminOnly, createTask);
router.put("/:id", adminOnly, updateTask);
router.patch("/:id/status", updateStatus);   // member can update status of their own task
router.delete("/:id", adminOnly, deleteTask);

// Checkpoint routes
router.post("/:id/checkpoints", adminOnly, addCheckpoint);
router.patch("/:id/checkpoints/:checkpointId", toggleCheckpoint); // member can mark/unmark
router.delete("/:id/checkpoints/:checkpointId", adminOnly, deleteCheckpoint);

module.exports = router;
