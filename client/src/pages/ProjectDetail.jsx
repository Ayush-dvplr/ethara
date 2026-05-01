import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Modal from "../components/Modal";
import TaskCard from "../components/TaskCard";
import { ArrowLeft, Plus, UserPlus, UserMinus, CheckSquare, Users } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

// Form to create a new task inside this project
const TaskForm = ({ projectId, members, onSubmit, loading }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
    priority: "medium",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, projectId }); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Task Title</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="What needs to be done?"
          required
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="More details (optional)"
          rows={3}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign To</label>
          <select
            name="assignedTo"
            value={form.assignedTo}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
        <input
          type="date"
          name="dueDate"
          value={form.dueDate}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create Task"}
      </button>
    </form>
  );
};

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.project);
      setTasks(res.data.tasks);
    } catch (err) {
      toast.error("Project not found");
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
    if (isAdmin) {
      api.get("/users").then((res) => setAllUsers(res.data.users)).catch(() => {});
    }
  }, [id]);

  const handleAddTask = async (form) => {
    setSaving(true);
    try {
      await api.post("/tasks", form);
      toast.success("Task created!");
      setShowAddTask(false);
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't create task");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return toast.error("Please select a user");
    setSaving(true);
    try {
      await api.post(`/projects/${id}/members`, { userId: selectedUserId });
      toast.success("Member added!");
      setShowAddMember(false);
      setSelectedUserId("");
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't add member");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Remove this member from the project?")) return;
    try {
      await api.delete(`/projects/${id}/members/${memberId}`);
      toast.success("Member removed");
      fetchProject();
    } catch (err) {
      toast.error("Couldn't remove member");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  // Only show users who aren't already members in the add-member dropdown
  const nonMembers = allUsers.filter((u) => !project.members.some((m) => m._id === u._id));
  const doneTasks = tasks.filter((t) => t.status === "completed");
  const progress = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  return (
    <div>
      {/* Back + header */}
      <div className="mb-6">
        <Link to="/projects" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-4 h-12 rounded-full" style={{ backgroundColor: project.color }} />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{project.name}</h1>
              {project.description && <p className="text-slate-500 mt-1">{project.description}</p>}
            </div>
          </div>

          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddMember(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Add Member
              </button>
              <button
                onClick={() => setShowAddTask(true)}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-slate-700">Overall Progress</span>
          <span className="text-slate-500">{doneTasks.length}/{tasks.length} tasks completed</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: project.color }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">{progress}% complete</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tasks — takes up 3/4 */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-500" />
              Tasks ({tasks.length})
            </h2>
          </div>

          {tasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No tasks yet</p>
              {isAdmin && (
                <button
                  onClick={() => setShowAddTask(true)}
                  className="mt-3 text-sm text-indigo-600 hover:underline"
                >
                  Create the first task
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tasks.map((task) => <TaskCard key={task._id} task={task} />)}
            </div>
          )}
        </div>

        {/* Members sidebar — 1/4 */}
        <div>
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-indigo-500" />
            Members ({project.members?.length || 0})
          </h2>

          <div className="space-y-2">
            {project.members?.length === 0 ? (
              <p className="text-sm text-slate-500">No members yet</p>
            ) : (
              project.members.map((member) => (
                <div key={member._id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{member.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{member.role}</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleRemoveMember(member._id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Task modal */}
      <Modal isOpen={showAddTask} onClose={() => setShowAddTask(false)} title="New Task" size="lg">
        <TaskForm
          projectId={id}
          members={project.members || []}
          onSubmit={handleAddTask}
          loading={saving}
        />
      </Modal>

      {/* Add Member modal */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member">
        <div className="space-y-4">
          {nonMembers.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">All users are already in this project</p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Select User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Choose a user...</option>
                  {nonMembers.map((u) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddMember}
                disabled={saving || !selectedUserId}
                className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Adding..." : "Add to Project"}
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetail;
