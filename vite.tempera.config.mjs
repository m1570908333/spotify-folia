import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const foliaSource = path.resolve(root, "../folia/folia-major-main/src");
const foliaModules = path.resolve(root, "../folia/folia-major-main/node_modules");

export default {
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": "{}",
    "process": "({ env: {} })",
  },
  resolve: {
    alias: {
      "@": foliaSource,
      "pixi.js/advanced-blend-modes": path.resolve(foliaModules, "pixi.js/lib/advanced-blend-modes/init.js"),
      "pixi.js": path.resolve(foliaModules, "pixi.js/lib/index.js"),
    },
  },
  build: {
    emptyOutDir: false,
    minify: "esbuild",
    target: "chrome120",
    lib: {
      entry: path.resolve(root, "adapter/tempera-runtime.ts"),
      name: "FoliaOriginalVisualizers",
      formats: ["iife"],
      fileName: () => "original-visualizers.js",
    },
    outDir: path.resolve(root, "prototype/folia-stage"),
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
};
