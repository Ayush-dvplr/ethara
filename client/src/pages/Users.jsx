import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Users as UsersIcon, Shield, User, Mail, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

const Users = () => {
  const { user: currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changingRole, setChangingRole] = useState(null); // id of user being updated

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data.users);
    } catch (err) {
      toast.error("Couldn't load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    setChangingRole(userId);
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
      // If admin just changed someone else's role, no need to refresh self
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't change role");
    } finally {
      setChangingRole(null);
    }
  };

  const admins = users.filter((u) => u.role === "admin");
  const members = users.filter((u) => u.role === "member");

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
        <h1 className="text-2xl font-bold text-slate-800">All Users</h1>
        <p className="text-slate-500 mt-1">
          {users.length} registered users — {admins.length} admin{admins.length !== 1 ? "s" : ""}, {members.length} member{members.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-indigo-700">{admins.length}</p>
            <p className="text-sm text-indigo-500">Admins</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-700">{members.length}</p>
            <p className="text-sm text-slate-500">Members</p>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-indigo-500" />
            All Members
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u._id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
              {/* Avatar */}
              {u.avatar ? (
                <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  u.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                }`}>
                  {u.name?.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Name + email */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                  {/* "You" badge */}
                  {u._id === currentUser?._id && (
                    <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">You</span>
                  )}
                  {/* Google badge — shows if they signed in with Google */}
                  {u.googleId && (
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Google
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                  <Mail className="w-3 h-3" />
                  <span>{u.email}</span>
                </div>
              </div>

              {/* Joined date */}
              <div className="text-xs text-slate-400 hidden sm:block">
                Joined {format(new Date(u.createdAt), "MMM d, yyyy")}
              </div>

              {/* Role selector — admin can change anyone's role except their own */}
              <div className="relative shrink-0">
                {u._id === currentUser?._id ? (
                  // Can't change your own role
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize ${
                    u.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {u.role}
                  </span>
                ) : (
                  <div className="relative">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      disabled={changingRole === u._id}
                      className={`text-xs pl-3 pr-8 py-1.5 rounded-full font-medium appearance-none cursor-pointer border transition-colors capitalize ${
                        u.role === "admin"
                          ? "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200"
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                      } ${changingRole === u._id ? "opacity-60" : ""}`}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-slate-500" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Users;
