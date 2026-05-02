import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import api from "../services/api";
import { AlertCircle, X, Menu, Zap } from "lucide-react";

// Main layout wrapper — sidebar on the left, content on the right
// All authenticated pages use this
const Layout = ({ children }) => {
  const [overdueCount, setOverdueCount] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch overdue count once when the layout mounts — shown as a top banner
  useEffect(() => {
    api.get("/tasks/overdue")
      .then((res) => setOverdueCount(res.data.count))
      .catch(() => {}); // don't break the app if this fails
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center gap-3 sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-800">Ethara</span>
          </div>
        </div>

        {/* Overdue alert banner — shows at top of every page when tasks are overdue */}
        {overdueCount > 0 && !bannerDismissed && (
          <div className="bg-red-600 text-white px-4 sm:px-6 py-2.5 flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                <strong>{overdueCount}</strong> task{overdueCount > 1 ? "s are" : " is"} overdue.{" "}
                <Link to="/tasks?filter=overdue" className="underline font-medium hover:no-underline whitespace-nowrap">
                  View overdue
                </Link>
              </span>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1 hover:bg-red-700 rounded transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
