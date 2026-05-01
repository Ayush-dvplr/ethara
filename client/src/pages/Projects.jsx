import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Modal from "../components/Modal";
import { FolderKanban, Plus, Users, CheckSquare, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

// A few color options for project cards
const COLOR_OPTIONS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#3b82f6", "#ef4444", "#06b6d4",
];

const ProjectForm = ({ initial, onSubmit, loading }) => {
  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    color: initial?.color || "#6366f1",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="e.g. Website Redesign"
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
          placeholder="What is this project about?"
          rows={3}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setForm({ ...form, color })}
              className={`w-7 h-7 rounded-full transition-all ${form.color === color ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : ""}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        {loading ? "Saving..." : initial ? "Update Project" : "Create Project"}
      </button>
    </form>
  );
};

const Projects = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchProjects = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([api.get("/projects"), api.get("/tasks")]);
      setProjects(projRes.data.projects);
      setTasks(taskRes.data.tasks);
    } catch (err) {
      toast.error("Couldn't load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await api.post("/projects", form);
      toast.success("Project created!");
      setShowCreate(false);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't create project");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (form) => {
    setSaving(true);
    try {
      await api.put(`/projects/${editProject._id}`, form);
      toast.success("Project updated!");
      setEditProject(null);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't update project");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete "${project.name}"? This will also delete all its tasks.`)) return;
    try {
      await api.delete(`/projects/${project._id}`);
      toast.success("Project deleted");
      fetchProjects();
    } catch (err) {
      toast.error("Couldn't delete project");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
          <p className="text-slate-500 mt-1">
            {isAdmin ? `${projects.length} total projects` : `You're in ${projects.length} project${projects.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No projects yet</p>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700"
            >
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const projectTasks = tasks.filter(
              (t) => t.project?._id === project._id || t.project === project._id
            );
            const doneTasks = projectTasks.filter((t) => t.status === "completed");
            const progress = projectTasks.length > 0 ? Math.round((doneTasks.length / projectTasks.length) * 100) : 0;

            return (
              <div key={project._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Color strip at top */}
                <div className="h-2" style={{ backgroundColor: project.color }} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-slate-800">{project.name}</h3>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditProject(project)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(project)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {project.description && (
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{project.description}</p>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{project.members?.length || 0} member{project.members?.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>{projectTasks.length} task{projectTasks.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%`, backgroundColor: project.color }}
                      />
                    </div>
                  </div>

                  <Link
                    to={`/projects/${project._id}`}
                    className="block text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-xl py-2 hover:bg-indigo-50 transition-colors"
                  >
                    Open Project
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create project modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <ProjectForm onSubmit={handleCreate} loading={saving} />
      </Modal>

      {/* Edit project modal */}
      <Modal isOpen={!!editProject} onClose={() => setEditProject(null)} title="Edit Project">
        {editProject && <ProjectForm initial={editProject} onSubmit={handleEdit} loading={saving} />}
      </Modal>
    </div>
  );
};

export default Projects;
