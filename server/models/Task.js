const mongoose = require("mongoose");

const checkpointSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Checkpoint title is required"],
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,  
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true } 
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // Which project this task belongs to
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    // The member this task is assigned to
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // The admin who created/assigned this task
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    // Per-task checkpoints defined by admin — each task can have completely different steps
    checkpoints: [checkpointSchema],
  },
  { timestamps: true }
);

// Virtual field — tells us if all checkpoints are done without storing it in DB
taskSchema.virtual("allCheckpointsDone").get(function () {
  if (this.checkpoints.length === 0) return false;
  return this.checkpoints.every((cp) => cp.isCompleted);
});

// Make virtuals show up in JSON responses
taskSchema.set("toJSON", { virtuals: true });
taskSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Task", taskSchema);
