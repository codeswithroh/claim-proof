import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: "all",
    proxy: {
      "/api": "http://localhost:3002",
    },
  },
  optimizeDeps: {
    exclude: ["snarkjs"],
  },
  define: {
    global: "globalThis",
  },
});
