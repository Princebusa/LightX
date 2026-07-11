import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  server: {
    allowedHosts: [
      "*.e2b.app"
    ],
    proxy: {
      // Forward API calls to the Express backend in dev.
      "/auth": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/projects": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
