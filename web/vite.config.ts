import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "..", "VITE_");
  const nodeRed = env.VITE_NODE_RED_URL || "http://localhost:1880";

  return {
    envDir: "..",
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: { output: { manualChunks: { chart: ["chart.js", "react-chartjs-2"], react: ["react", "react-dom", "react-router"] } } },
    },
    server: { port: 5173, proxy: { "/api": nodeRed } },
    preview: { port: 4173, proxy: { "/api": nodeRed } },
  };
});
