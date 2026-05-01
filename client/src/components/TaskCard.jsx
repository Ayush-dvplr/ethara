import { Link } from "react-router-dom";
import { Calendar, AlertCircle, CheckCircle2, Clock, Circle } from "lucide-react";
import { format, isPast, isToday } from "date-fns";

// Reusable task card shown on dashboard and task list pages
const TaskCard = ({ task }) => {
  const doneCount = task.checkpoints?.filter((cp) => cp.isCompleted).length || 0;
  const totalCount = task.checkpoints?.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Due date display logic — overdue tasks get a red warning
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "completed";
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  const statusConfig = {
    pending: { icon: Circle, color: "text-slate-400", bg: "bg-slate-100", label: "Pending" },
    "in-progress": { icon: Clock, color: "text-blue-500", bg: "bg-blue-50", label: "In Progress" },
    completed: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50", label: "Completed" },
  };

  const priorityColor = {
    low: "bg-slate-100 text-slate-600",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  const { icon: StatusIcon, color: statusColor, bg: statusBg, label: statusLabel } =
    statusConfig[task.status] || statusConfig.pending;

  return (
    <Link
      to={`/tasks/${task._id}`}
      className="block bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
    >
      {/* Top row — title + priority */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-slate-800 text-sm leading-tight">{task.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 capitalize ${priorityColor[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      {/* Project name */}
      {task.project && (
        <div className="flex items-center gap-1.5 mb-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: task.project.color || "#6366f1" }}
          />
          <span className="text-xs text-slate-500">{task.project.name}</span>
        </div>
      )}

      {/* Checkpoint progress bar */}
      {totalCount > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Checkpoints</span>
            <span>{doneCount}/{totalCount}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${task.status === "completed" ? "bg-green-500" : "bg-indigo-500"}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Bottom row — status + due date */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statusBg}`}>
          <StatusIcon className={`w-3 h-3 ${statusColor}`} />
          <span className={statusColor}>{statusLabel}</span>
        </div>

        {task.dueDate && (
          <div className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-600" : isDueToday ? "text-orange-500" : "text-slate-500"}`}>
            {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
            <span>{isOverdue ? "Overdue · " : ""}{format(new Date(task.dueDate), "MMM d")}</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default TaskCard;
