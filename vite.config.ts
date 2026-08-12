/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves from a repository sub-path, e.g.
// https://<username>.github.io/<repo-name>/
// Override the base path without editing this file:
//   GH_PAGES_BASE=/my-repo/ npm run build
const base = process.env.GH_PAGES_BASE ?? "/peacock-agent-poc/";

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
