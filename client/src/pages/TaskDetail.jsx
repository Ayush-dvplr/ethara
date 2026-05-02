import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Modal from "../components/Modal";
import {
  ArrowLeft, Plus, Trash2, CheckCircle2, Circle, AlertCircle,
  Calendar, User, Flag, Pencil, Clock
} from "lucide-react";
import toast from "react-hot-toast";
import { format, isPast, isToday } from "date-fns";

const priorityConfig = {
  low: { color: "text-slate-600", bg: "bg-slate-100" },
  medium: { color: "text-yellow-700", bg: "bg-yellow-100" },
  high: { color: "text-red-700", bg: "bg-red-100" },
};

const statusConfig = {
  pending: { color: "text-slate-500", bg: "bg-slate-100", label: "Pending" },
  "in-progress": { color: "text-blue-600", bg: "bg-blue-100", label: "In Progress" },
  completed: { color: "text-green-600", bg: "bg-green-100", label: "Completed" },
};

const TaskDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddCheckpoint, setShowAddCheckpoint] = useState(false);
  const [checkpointTitle, setCheckpointTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  // Edit form state
  const [editForm, setEditForm] = useState({});

  const fetchTask = async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data.task);
      setEditForm({
        title: res.data.task.title,
        description: res.data.task.description,
        assignedTo: res.data.task.assignedTo?._id || "",
        dueDate: res.data.task.dueDate ? format(new Date(res.data.task.dueDate), "yyyy-MM-dd") : "",
        priority: res.data.task.priority,
        status: res.data.task.status,
      });
    } catch (err) {
      toast.error("Task not found");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
    if (isAdmin) {
      api.get("/users").then((res) => setAllUsers(res.data.users)).catch(() => {});
    }
  }, [id]);

  const handleAddCheckpoint = async (e) => {
    e.preventDefault();
    if (!checkpointTitle.trim()) return;
    setSaving(true);
    try {
      await api.post(`/tasks/${id}/checkpoints`, { title: checkpointTitle });
      toast.success("Checkpoint added");
      setCheckpointTitle("");
      setShowAddCheckpoint(false);
      fetchTask();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't add checkpoint");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCheckpoint = async (checkpointId) => {
    try {
      const res = await api.patch(`/tasks/${id}/checkpoints/${checkpointId}`);
      // Update task in state directly so the UI feels instant
      setTask((prev) => ({
        ...prev,
        checkpoints: res.data.checkpoints,
        status: res.data.status,
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't update checkpoint");
    }
  };

  // Member (and admin) can directly change the task status
  const handleStatusChange = async (newStatus) => {
    if (newStatus === task.status) return;
    try {
      await api.patch(`/tasks/${id}/status`, { status: newStatus });
      setTask((prev) => ({ ...prev, status: newStatus }));
      toast.success(`Marked as ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't update status");
    }
  };

  const handleDeleteCheckpoint = async (checkpointId) => {
    if (!window.confirm("Remove this checkpoint?")) return;
    try {
      const res = await api.delete(`/tasks/${id}/checkpoints/${checkpointId}`);
      setTask((prev) => ({ ...prev, checkpoints: res.data.checkpoints }));
      toast.success("Checkpoint removed");
    } catch (err) {
      toast.error("Couldn't delete checkpoint");
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/tasks/${id}`, editForm);
      toast.success("Task updated!");
      setShowEditTask(false);
      fetchTask();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't update task");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm("Delete this task? This can't be undone.")) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success("Task deleted");
      navigate(-1);
    } catch (err) {
      toast.error("Couldn't delete task");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!task) return null;

  const doneCount = task.checkpoints?.filter((cp) => cp.isCompleted).length || 0;
  const totalCount = task.checkpoints?.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "completed";
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  const { color: priorityColor, bg: priorityBg } = priorityConfig[task.priority] || priorityConfig.medium;
  const { color: statusColor, bg: statusBg, label: statusLabel } = statusConfig[task.status] || statusConfig.pending;

  return (
    <div className="max-w-3xl">
      {/* Back link */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Task header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-slate-800 leading-tight">{task.title}</h1>
          {isAdmin && (
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowEditTask(true)}
                className="flex-1 sm:flex-none flex justify-center items-center p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteTask}
                className="flex-1 sm:flex-none flex justify-center items-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {task.description && (
          <p className="text-slate-600 text-sm mb-4 leading-relaxed">{task.description}</p>
        )}

        {/* Meta info pills */}
        <div className="flex flex-wrap gap-2">
          <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${statusBg} ${statusColor}`}>
            {task.status === "completed" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            {statusLabel}
          </span>

          <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium capitalize ${priorityBg} ${priorityColor}`}>
            <Flag className="w-3.5 h-3.5" />
            {task.priority}
          </span>

          {task.assignedTo && (
            <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
              <User className="w-3.5 h-3.5" />
              {task.assignedTo.name}
            </span>
          )}

          {task.dueDate && (
            <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
              isOverdue ? "bg-red-100 text-red-700" : isDueToday ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"
            }`}>
              {isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
              {isOverdue ? "Overdue — " : isDueToday ? "Due today — " : "Due "}
              {format(new Date(task.dueDate), "MMM d, yyyy")}
            </span>
          )}

          {task.project && (
            <Link
              to={`/projects/${task.project._id}`}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity font-medium"
              style={{ backgroundColor: `${task.project.color}20`, color: task.project.color }}
            >
              {task.project.name}
            </Link>
          )}
        </div>
      </div>

      {/* Member action panel — update status directly
          Shown for the assigned member (and admin too as a quick shortcut) */}
      {task.status !== "completed" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <p className="text-sm font-semibold text-slate-700 mb-3">Update your progress</p>
          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
            {[
              { value: "pending",     label: "Not started", color: "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200" },
              { value: "in-progress", label: "Working on it", color: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" },
              { value: "completed",   label: "Mark complete", color: "bg-green-50 text-green-700 hover:bg-green-100 border-green-200" },
            ].map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => handleStatusChange(value)}
                className={`flex-1 w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-sm font-medium border transition-colors ${color} ${
                  task.status === value ? "ring-2 ring-offset-1 ring-current opacity-100" : "opacity-70"
                }`}
              >
                {task.status === value ? `✓ ${label}` : label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Once complete — show a reopen button so it can be moved back */}
      {task.status === "completed" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-semibold">This task is complete</span>
          </div>
          <button
            onClick={() => handleStatusChange("in-progress")}
            className="text-sm text-green-700 underline hover:no-underline"
          >
            Reopen
          </button>
        </div>
      )}

      {/* Checkpoints section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-slate-800">Checkpoints</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {totalCount === 0
                ? "No checkpoints yet"
                : `${doneCount} of ${totalCount} done (${progressPercent}%)`}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddCheckpoint(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Checkpoint
            </button>
          )}
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="mb-5">
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${progressPercent === 100 ? "bg-green-500" : "bg-indigo-500"}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Checkpoint list */}
        {totalCount === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              {isAdmin ? "Add checkpoints to break this task into smaller steps" : "No checkpoints defined for this task"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {task.checkpoints.map((cp) => (
              <div
                key={cp._id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  cp.isCompleted ? "bg-green-50" : "bg-slate-50 hover:bg-slate-100"
                }`}
              >
                {/* Toggle button — member and admin can both click this */}
                <button
                  onClick={() => handleToggleCheckpoint(cp._id)}
                  className="shrink-0 transition-colors"
                >
                  {cp.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-500" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${cp.isCompleted ? "line-through text-slate-400" : "text-slate-700"}`}>
                    {cp.title}
                  </p>
                  {cp.isCompleted && cp.completedBy && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Done by {cp.completedBy.name} · {format(new Date(cp.completedAt), "MMM d, h:mm a")}
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteCheckpoint(cp._id)}
                    className="shrink-0 p-1 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Checkpoint modal */}
      <Modal isOpen={showAddCheckpoint} onClose={() => setShowAddCheckpoint(false)} title="Add Checkpoint">
        <form onSubmit={handleAddCheckpoint} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Checkpoint Name</label>
            <input
              value={checkpointTitle}
              onChange={(e) => setCheckpointTitle(e.target.value)}
              placeholder="e.g. Write unit tests, Review design, Deploy to staging..."
              autoFocus
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !checkpointTitle.trim()}
            className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Adding..." : "Add Checkpoint"}
          </button>
        </form>
      </Modal>

      {/* Edit Task modal */}
      <Modal isOpen={showEditTask} onClose={() => setShowEditTask(false)} title="Edit Task" size="lg">
        <form onSubmit={handleEditTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
            <input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign To</label>
              <select
                value={editForm.assignedTo}
                onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Unassigned</option>
                {allUsers.map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
              <input
                type="date"
                value={editForm.dueDate}
                onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default TaskDetail;
