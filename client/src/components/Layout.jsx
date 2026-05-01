import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import api from "../services/api";
import { AlertCircle, X } from "lucide-react";

// Main layout wrapper — sidebar on the left, content on the right
// All authenticated pages use this
const Layout = ({ children }) => {
  const [overdueCount, setOverdueCount] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Fetch overdue count once when the layout mounts — shown as a top banner
  useEffect(() => {
    api.get("/tasks/overdue")
      .then((res) => setOverdueCount(res.data.count))
      .catch(() => {}); // don't break the app if this fails
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        {/* Overdue alert banner — shows at top of every page when tasks are overdue */}
        {overdueCount > 0 && !bannerDismissed && (
          <div className="bg-red-600 text-white px-6 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                <strong>{overdueCount}</strong> task{overdueCount > 1 ? "s are" : " is"} overdue.{" "}
                <Link to="/tasks?filter=overdue" className="underline font-medium hover:no-underline">
                  View overdue tasks
                </Link>
              </span>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1 hover:bg-red-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
