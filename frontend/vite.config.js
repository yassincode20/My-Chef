import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev-only proxy so the browser can call /api/... and Vite forwards it to
// your FastAPI backend at http://localhost:8000. This sidesteps CORS
// entirely while you're developing — no changes needed on the backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
