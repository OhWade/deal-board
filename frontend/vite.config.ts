import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In dev, /api calls go to the Express server, so no CORS setup is needed locally
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
