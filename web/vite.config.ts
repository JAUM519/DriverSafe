import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: { output: { manualChunks: { recharts: ["recharts"], react: ["react", "react-dom", "react-router"] } } },
  },
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:3001" },
  },
});
