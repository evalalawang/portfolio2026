import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "::",
    port: 43123,
    strictPort: true,
    allowedHosts: true,
  },
});
