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
    name: "folia-isolate-react-lyric-motion",
    transform(code, id) {
      if (!id.includes("folia-major-main\\src\\components\\visualizer\\monet\\MonetRailLine.tsx") &&
          !id.includes("folia-major-main/src/components/visualizer/monet/MonetRailLine.tsx") &&
          !id.includes("folia-major-main\\src\\components\\visualizer\\tilt\\VisualizerTilt.tsx") &&
          !id.includes("folia-major-main/src/components/visualizer/tilt/VisualizerTilt.tsx")) {
        return null;
      }

      let next = code;
      if (id.includes("MonetRailLine.tsx")) {
        next = next.replace(
          "audioPower={audioPower}",
          "audioPower={isActiveLine ? audioPower : undefined}",
        );
      }
      if (id.includes("VisualizerTilt.tsx")) {
        next = next.replace(
          "layout.segments.map(seg => {",
          "layout.segments.map((seg, segmentIndex) => {",
        ).replace(
          "return {\n                start: activeLine.startTime,\n                end: getLineRenderEndTime(activeLine),\n            };",
          "const lineStart = activeLine.startTime;\n            const lineEnd = getLineRenderEndTime(activeLine);\n            const segmentDuration = Math.max(0.12, (lineEnd - lineStart) / Math.max(1, layout.segments.length));\n            return {\n                start: lineStart + segmentDuration * segmentIndex,\n                end: Math.min(lineEnd, lineStart + segmentDuration * (segmentIndex + 1)),\n            };",
        );
      }
      return next === code ? null : { code: next, map: null };
    },
  }, {
    name: "folia-inject-react-stage-css",
    closeBundle() {
      const output = path.resolve(root, "prototype/folia-stage");
      const cssPath = path.resolve(output, "original-react-stages.css");
      const jsPath = path.resolve(output, "original-react-stages.js");
      if (!fs.existsSync(cssPath) || !fs.existsSync(jsPath)) return;
      const marker = "folia-original-react-stages-css";
      const current = fs.readFileSync(jsPath, "utf8");
      if (current.startsWith(`(()=>{const id=${JSON.stringify(marker)}`)) return;
      const css = fs.readFileSync(cssPath, "utf8");
      const injection = `globalThis.__foliaReactRequire=(id)=>{if(id==="react")return Spicetify.React;if(id==="react/jsx-runtime")return Spicetify.ReactJSXRuntime;throw new Error("Unsupported Folia runtime dependency: "+id)};\n`;
      const rewritten = current.replace(/\brequire\s*\(/g, "globalThis.__foliaReactRequire(");
      const styleInjection = `(()=>{const id=${JSON.stringify(marker)};let style=document.getElementById(id);if(!style){style=document.createElement("style");style.id=id;document.head.appendChild(style)}style.textContent=${JSON.stringify(css)}})();\n`;
      fs.writeFileSync(jsPath, injection + styleInjection + rewritten);
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
      "pixi.js/advanced-blend-modes": path.resolve(foliaRoot, "node_modules/pixi.js/lib/advanced-blend-modes/init.js"),
      "pixi.js": path.resolve(foliaRoot, "node_modules/pixi.js/lib/index.js"),
    },
  },
  css: {
    postcss: {
      plugins: [requireFromFolia("@tailwindcss/postcss"), requireFromFolia("autoprefixer")],
    },
  },
  build: {
    copyPublicDir: false,
    emptyOutDir: false,
    minify: "esbuild",
    target: "chrome120",
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(root, "adapter/original-react-stages.ts"),
      name: "FoliaOriginalReactStages",
      formats: ["iife"],
      fileName: () => "original-react-stages.js",
      cssFileName: "original-react-stages",
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
        assetFileNames: "[name][extname]",
      },
    },
  },
};
