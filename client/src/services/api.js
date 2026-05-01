import axios from "axios";

// Central axios instance — every API call goes through here
// This way we only set the base URL and auth header in one place
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

// Before every request, grab the token from localStorage and attach it
// This means we never have to manually add the Authorization header in each call
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ethara_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If we get a 401 anywhere, the token is gone or expired — wipe local storage and reload
// This prevents the user from being stuck in a broken logged-in-but-not-really state
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("ethara_token");
      localStorage.removeItem("ethara_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
