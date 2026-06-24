import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// In dev, requests to /api are proxied to the FastAPI backend so the browser
// never has to deal with CORS or hardcoded hosts. In production the frontend
// talks to VITE_API_URL directly (see src/api/client.js).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = env.VITE_DEV_BACKEND || "http://127.0.0.1:8000";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: backend,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      chunkSizeWarningLimit: 1200,
    },
  };
});
