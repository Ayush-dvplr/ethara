const Task = require("../models/Task");
const Project = require("../models/Project");

// GET /api/tasks
// Admin sees all tasks; member sees only tasks assigned to them
const getTasks = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { assignedTo: req.user._id };

    // Allow filtering by project
    if (req.query.projectId) filter.project = req.query.projectId;
    // Allow filtering by status
    if (req.query.status) filter.status = req.query.status;

    const tasks = await Task.find(filter)
      .populate("project", "name color")
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name")
      .populate("checkpoints.completedBy", "name")
      .sort({ dueDate: 1, createdAt: -1 }); // sort by due date first — overdue ones bubble up

    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch tasks" });
  }
};

// GET /api/tasks/overdue
// Returns tasks that are past their due date and not yet completed
const getOverdueTasks = async (req, res) => {
  try {
    const filter = {
      dueDate: { $lt: new Date() },
      status: { $ne: "completed" },
    };

    // Members only see their own overdue tasks
    if (req.user.role !== "admin") filter.assignedTo = req.user._id;

    const tasks = await Task.find(filter)
      .populate("project", "name color")
      .populate("assignedTo", "name email avatar")
      .sort({ dueDate: 1 }); // most overdue first

    res.json({ tasks, count: tasks.length });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch overdue tasks" });
  }
};

// GET /api/tasks/:id
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("project", "name color members")
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("checkpoints.completedBy", "name avatar");

    if (!task) return res.status(404).json({ message: "Task not found" });

    // Member can only see tasks assigned to them
    if (
      req.user.role !== "admin" &&
      task.assignedTo?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "You don't have access to this task" });
    }

    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch task" });
  }
};

// POST /api/tasks — admin only
const createTask = async (req, res) => {
  const { title, description, projectId, assignedTo, dueDate, priority } = req.body;

  if (!title) return res.status(400).json({ message: "Task title is required" });
  if (!projectId) return res.status(400).json({ message: "Project is required" });

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // If assigning to someone, make sure they're actually in the project
    if (assignedTo) {
      const isMember = project.members.some((m) => m.toString() === assignedTo);
      if (!isMember) {
        return res.status(400).json({ message: "Assigned user is not a member of this project" });
      }
    }

    const task = await Task.create({
      title,
      description: description || "",
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      dueDate: dueDate || null,
      priority: priority || "medium",
    });

    await task.populate([
      { path: "project", select: "name color" },
      { path: "assignedTo", select: "name email avatar" },
      { path: "createdBy", select: "name" },
    ]);

    res.status(201).json({ task });
  } catch (err) {
    res.status(500).json({ message: "Could not create task" });
  }
};

// PUT /api/tasks/:id — admin only
const updateTask = async (req, res) => {
  const { title, description, assignedTo, dueDate, priority, status } = req.body;

  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(dueDate !== undefined && { dueDate }),
        ...(priority && { priority }),
        ...(status && { status }),
      },
      { new: true }
    )
      .populate("project", "name color")
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: "Could not update task" });
  }
};

// PATCH /api/tasks/:id/status
// Members can update the status of tasks assigned to them
// Admin can update the status of any task
const updateStatus = async (req, res) => {
  const { status } = req.body;

  if (!["pending", "in-progress", "completed"].includes(status)) {
    return res.status(400).json({ message: "Status must be pending, in-progress, or completed" });
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Members can only update tasks assigned to them
    if (req.user.role !== "admin" && task.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only update tasks assigned to you" });
    }

    task.status = status;
    await task.save();

    res.json({ status: task.status, message: `Task marked as ${status}` });
  } catch (err) {
    res.status(500).json({ message: "Could not update status" });
  }
};

// DELETE /api/tasks/:id — admin only
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: "Could not delete task" });
  }
};

// POST /api/tasks/:id/checkpoints — admin only, add a new checkpoint to a task
const addCheckpoint = async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: "Checkpoint title is required" });

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.checkpoints.push({ title });
    await task.save();

    res.status(201).json({ checkpoints: task.checkpoints, message: "Checkpoint added" });
  } catch (err) {
    res.status(500).json({ message: "Could not add checkpoint" });
  }
};

// PATCH /api/tasks/:id/checkpoints/:checkpointId — member marks a checkpoint as done
// Admin can also use this to manually mark/unmark
const toggleCheckpoint = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Members can only toggle checkpoints on their own tasks
    if (
      req.user.role !== "admin" &&
      task.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "This task isn't assigned to you" });
    }

    const checkpoint = task.checkpoints.id(req.params.checkpointId);
    if (!checkpoint) return res.status(404).json({ message: "Checkpoint not found" });

    // Toggle on/off
    checkpoint.isCompleted = !checkpoint.isCompleted;
    checkpoint.completedBy = checkpoint.isCompleted ? req.user._id : null;
    checkpoint.completedAt = checkpoint.isCompleted ? new Date() : null;

    // Auto-update task status based on checkpoints
    const total = task.checkpoints.length;
    const done = task.checkpoints.filter((cp) => cp.isCompleted).length;

    if (done === 0) task.status = "pending";
    else if (done === total) task.status = "completed";
    else task.status = "in-progress";

    await task.save();

    await task.populate([
      { path: "checkpoints.completedBy", select: "name avatar" },
    ]);

    res.json({ checkpoints: task.checkpoints, status: task.status });
  } catch (err) {
    res.status(500).json({ message: "Could not update checkpoint" });
  }
};

// DELETE /api/tasks/:id/checkpoints/:checkpointId — admin only
const deleteCheckpoint = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.checkpoints = task.checkpoints.filter(
      (cp) => cp._id.toString() !== req.params.checkpointId
    );

    await task.save();
    res.json({ checkpoints: task.checkpoints, message: "Checkpoint removed" });
  } catch (err) {
    res.status(500).json({ message: "Could not delete checkpoint" });
  }
};

module.exports = {
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
};
