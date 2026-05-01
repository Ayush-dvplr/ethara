import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Proxy API calls to the backend so we don't deal with CORS in development
    proxy: {
      "/api": {
        target: "https://project.altechsolution.in",
        changeOrigin: true,
      },
    },
  },
});
