const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");

// GET /api/projects
// Admin sees all projects; member sees only projects they're in
const getProjects = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { members: req.user._id };
    const projects = await Project.find(filter)
      .populate("createdBy", "name email avatar")
      .populate("members", "name email avatar role")
      .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch projects" });
  }
};

// GET /api/projects/:id
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("createdBy", "name email avatar")
      .populate("members", "name email avatar role");

    if (!project) return res.status(404).json({ message: "Project not found" });

    // Members can only see projects they're part of
    const isMember = project.members.some((m) => m._id.toString() === req.user._id.toString());
    if (req.user.role !== "admin" && !isMember) {
      return res.status(403).json({ message: "You're not part of this project" });
    }

    // Also include tasks for this project in the same response
    const tasks = await Task.find({ project: project._id })
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json({ project, tasks });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch project" });
  }
};

// POST /api/projects — admin only
const createProject = async (req, res) => {
  const { name, description, color } = req.body;

  if (!name) return res.status(400).json({ message: "Project name is required" });

  try {
    const project = await Project.create({
      name,
      description: description || "",
      color: color || "#6366f1",
      createdBy: req.user._id,
      members: [], // start with no members — add them separately
    });

    await project.populate("createdBy", "name email avatar");
    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ message: "Could not create project" });
  }
};

// PUT /api/projects/:id — admin only
const updateProject = async (req, res) => {
  const { name, description, color } = req.body;

  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name }), ...(description !== undefined && { description }), ...(color && { color }) },
      { new: true }
    )
      .populate("createdBy", "name email avatar")
      .populate("members", "name email avatar role");

    if (!project) return res.status(404).json({ message: "Project not found" });

    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: "Could not update project" });
  }
};

// DELETE /api/projects/:id — admin only
// Also removes all tasks that belong to this project
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ message: "Project and all its tasks have been deleted" });
  } catch (err) {
    res.status(500).json({ message: "Could not delete project" });
  }
};

// POST /api/projects/:id/members — admin only, add a member to the project
const addMember = async (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ message: "userId is required" });

  try {
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Don't add the same person twice
    if (project.members.includes(userId)) {
      return res.status(400).json({ message: `${user.name} is already in this project` });
    }

    project.members.push(userId);
    await project.save();
    await project.populate("members", "name email avatar role");

    res.json({ message: `${user.name} added to project`, project });
  } catch (err) {
    res.status(500).json({ message: "Could not add member" });
  }
};

// DELETE /api/projects/:id/members/:userId — admin only, remove a member
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    project.members = project.members.filter((m) => m.toString() !== req.params.userId);
    await project.save();
    await project.populate("members", "name email avatar role");

    res.json({ message: "Member removed from project", project });
  } catch (err) {
    res.status(500).json({ message: "Could not remove member" });
  }
};

module.exports = { getProjects, getProjectById, createProject, updateProject, deleteProject, addMember, removeMember };
