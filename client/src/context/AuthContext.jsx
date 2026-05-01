import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { signInWithGoogle } from "../services/firebase";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we're checking if the user is logged in

  // On app load, check if there's a saved token and restore the session
  useEffect(() => {
    const token = localStorage.getItem("ethara_token");
    const savedUser = localStorage.getItem("ethara_user");

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Re-verify the token with the server to make sure it's still valid
      api.get("/auth/me")
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem("ethara_token");
          localStorage.removeItem("ethara_user");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const saveSession = (token, userData) => {
    localStorage.setItem("ethara_token", token);
    localStorage.setItem("ethara_user", JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    saveSession(res.data.token, res.data.user);
    toast.success(`Welcome to Ethara, ${res.data.user.name}!`);
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    saveSession(res.data.token, res.data.user);
    toast.success(`Welcome back, ${res.data.user.name}!`);
  };

  const loginWithGoogle = async () => {
    const idToken = await signInWithGoogle();
    const res = await api.post("/auth/google", { idToken });
    saveSession(res.data.token, res.data.user);
    toast.success(`Welcome, ${res.data.user.name}!`);
  };

  const logout = () => {
    localStorage.removeItem("ethara_token");
    localStorage.removeItem("ethara_user");
    setUser(null);
    toast.success("Logged out successfully");
  };

  // After role change or profile update, refresh the stored user info
  const refreshUser = async () => {
    const res = await api.get("/auth/me");
    const updatedUser = res.data.user;
    localStorage.setItem("ethara_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — components just call useAuth() instead of useContext(AuthContext)
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
