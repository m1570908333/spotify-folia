import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import fs from "node:fs";

const root = path.dirname(fileURLToPath(import.meta.url));
const foliaRoot = path.resolve(root, "../folia/folia-major-main");
const foliaSource = path.resolve(foliaRoot, "src");
const requireFromFolia = createRequire(path.resolve(foliaRoot, "package.json"));

export default {
  plugins: [{
    name: "folia-background-react-compat",
    closeBundle() {
      const jsPath = path.resolve(root, "prototype/folia-stage/original-backgrounds.js");
      if (!fs.existsSync(jsPath)) return;
      const marker = "/* folia-background-react-compat */";
      const current = fs.readFileSync(jsPath, "utf8");
      if (current.startsWith(marker)) return;
      const compatibility = `${marker}\nglobalThis.__foliaBackgroundRequire=(id)=>{if(id==="react")return Spicetify.React;if(id==="react/jsx-runtime")return Spicetify.ReactJSXRuntime;throw new Error("Unsupported Folia background dependency: "+id)};\n`;
      const rewritten = current.replace(/\brequire\s*\(/g, "globalThis.__foliaBackgroundRequire(");
      fs.writeFileSync(jsPath, compatibility + rewritten);
    },
  }],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": "{}",
    "process": "({ env: {} })",
  },
  resolve: {
    alias: {
      "@": foliaSource,
      "framer-motion": requireFromFolia.resolve("framer-motion"),
    },
  },
  build: {
    copyPublicDir: false,
    emptyOutDir: false,
    minify: "esbuild",
    target: "chrome120",
    lib: {
      entry: path.resolve(root, "adapter/original-backgrounds.ts"),
      name: "FoliaOriginalBackgrounds",
      formats: ["iife"],
      fileName: () => "original-backgrounds.js",
    },
    outDir: path.resolve(root, "prototype/folia-stage"),
    rollupOptions: {
      external: ["react", "react/jsx-runtime"],
      output: {
        inlineDynamicImports: true,
        globals: {
          react: "Spicetify.React",
          "react/jsx-runtime": "Spicetify.ReactJSXRuntime",
        },
      },
    },
  },
};
