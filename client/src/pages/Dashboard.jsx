import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import TaskCard from "../components/TaskCard";
import { FolderKanban, CheckSquare, AlertCircle, TrendingUp, Plus, ArrowRight } from "lucide-react";

// Stat card used in the top summary row
const StatCard = ({ label, value, icon: Icon, color, bg }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
      </div>
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, overdueRes, projectsRes] = await Promise.all([
          api.get("/tasks"),
          api.get("/tasks/overdue"),
          api.get("/projects"),
        ]);
        setTasks(tasksRes.data.tasks);
        setOverdueTasks(overdueRes.data.tasks);
        setProjects(projectsRes.data.projects);
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const isAdmin = user?.role === "admin";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            {isAdmin ? "Here's what's happening across all projects" : "Here's what's on your plate today"}
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/projects"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Projects" value={projects.length} icon={FolderKanban} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard label="Pending Tasks" value={pendingTasks.length} icon={CheckSquare} color="text-slate-600" bg="bg-slate-100" />
        <StatCard label="In Progress" value={inProgressTasks.length} icon={TrendingUp} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Overdue" value={overdueTasks.length} icon={AlertCircle} color="text-red-600" bg="bg-red-50" />
      </div>

      {/* Overdue alert banner — only show if there are overdue tasks */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">
              {overdueTasks.length} task{overdueTasks.length > 1 ? "s are" : " is"} overdue
            </p>
            <p className="text-sm text-red-600 mt-0.5">These tasks are past their due date and still not completed.</p>
          </div>
          <Link to="/tasks?filter=overdue" className="text-sm font-medium text-red-700 hover:underline shrink-0">
            View all
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column — recent tasks */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">
              {isAdmin ? "All Recent Tasks" : "My Tasks"}
            </h2>
            <Link to="/tasks" className="flex items-center gap-1 text-sm text-indigo-600 hover:underline">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {tasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                {isAdmin ? "No tasks yet — create a project and start adding tasks" : "No tasks assigned to you yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tasks.slice(0, 6).map((task) => (
                <TaskCard key={task._id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* Right column — projects summary */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Projects</h2>
            <Link to="/projects" className="flex items-center gap-1 text-sm text-indigo-600 hover:underline">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No projects yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => {
                const projectTasks = tasks.filter((t) => t.project?._id === project._id || t.project === project._id);
                const doneTasks = projectTasks.filter((t) => t.status === "completed");
                const progress = projectTasks.length > 0 ? Math.round((doneTasks.length / projectTasks.length) * 100) : 0;

                return (
                  <Link
                    key={project._id}
                    to={`/projects/${project._id}`}
                    className="block bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                      <span className="font-medium text-slate-800 text-sm truncate">{project.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span>{projectTasks.length} task{projectTasks.length !== 1 ? "s" : ""}</span>
                      <span>{progress}% done</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Admin-only: show overdue tasks section */}
      {isAdmin && overdueTasks.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-slate-800 mb-4">Overdue Tasks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdueTasks.slice(0, 6).map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
