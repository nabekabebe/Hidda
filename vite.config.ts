import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { nightAtlasSharePlugin } from "./vite.share-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), nightAtlasSharePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
  },
});
