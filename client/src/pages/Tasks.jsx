import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import TaskCard from "../components/TaskCard";
import { CheckSquare, Filter } from "lucide-react";
import toast from "react-hot-toast";

const STATUSES = ["all", "pending", "in-progress", "completed"];

const Tasks = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(searchParams.get("filter") || "all");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // If URL has ?filter=overdue, use the dedicated overdue endpoint
        if (activeFilter === "overdue") {
          const res = await api.get("/tasks/overdue");
          setTasks(res.data.tasks);
        } else {
          const params = activeFilter !== "all" ? `?status=${activeFilter}` : "";
          const res = await api.get(`/tasks${params}`);
          setTasks(res.data.tasks);
        }
      } catch (err) {
        toast.error("Couldn't load tasks");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [activeFilter]);

  const filterLabels = {
    all: "All Tasks",
    pending: "Pending",
    "in-progress": "In Progress",
    completed: "Completed",
    overdue: "Overdue",
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          {user?.role === "admin" ? "All Tasks" : "My Tasks"}
        </h1>
        <p className="text-slate-500 mt-1">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit max-w-full overflow-x-auto no-scrollbar">
        <Filter className="w-4 h-4 text-slate-400 ml-2" />
        {[...STATUSES, "overdue"].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize ${
              activeFilter === filter
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            } ${filter === "overdue" ? "text-red-500" : ""}`}
          >
            {filterLabels[filter]}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-20">
          <CheckSquare className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No tasks in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => <TaskCard key={task._id} task={task} />)}
        </div>
      )}
    </div>
  );
};

export default Tasks;
