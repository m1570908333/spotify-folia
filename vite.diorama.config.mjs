import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.dirname(fileURLToPath(import.meta.url));
const foliaRoot = path.resolve(root, "../folia/folia-major-main");
const requireFromFolia = createRequire(path.resolve(foliaRoot, "package.json"));

export default {
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": "{}",
    "process": "({ env: {} })",
  },
  resolve: {
    alias: [
      { find: /^\.\.\/VisualizerShell$/, replacement: path.resolve(root, "adapter/diorama-visualizer-shell.tsx") },
      { find: /[\\/]components[\\/]visualizer[\\/]VisualizerShell(?:\.tsx)?$/, replacement: path.resolve(root, "adapter/diorama-visualizer-shell.tsx") },
      { find: /^@\//, replacement: `${path.resolve(foliaRoot, "src")}/` },
      { find: /^react\/jsx-runtime$/, replacement: requireFromFolia.resolve("react/jsx-runtime") },
      { find: /^react\/jsx-dev-runtime$/, replacement: requireFromFolia.resolve("react/jsx-dev-runtime") },
      { find: /^react$/, replacement: requireFromFolia.resolve("react") },
      { find: /^react-dom\/client$/, replacement: requireFromFolia.resolve("react-dom/client") },
      { find: /^react-dom\/server$/, replacement: requireFromFolia.resolve("react-dom/server") },
      { find: /^react-dom$/, replacement: requireFromFolia.resolve("react-dom") },
      { find: /^framer-motion$/, replacement: requireFromFolia.resolve("framer-motion") },
    ],
  },
  build: {
    copyPublicDir: false,
    emptyOutDir: false,
    minify: "esbuild",
    target: "chrome120",
    lib: {
      entry: path.resolve(root, "adapter/diorama-runtime.tsx"),
      name: "FoliaOriginalDiorama",
      formats: ["iife"],
      fileName: () => "original-diorama.js",
    },
    outDir: path.resolve(root, "prototype/folia-stage"),
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
};
