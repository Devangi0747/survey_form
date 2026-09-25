import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("manifest.json", "dist/manifest.json");
await cp("src/popup/popup.html", "dist/popup/popup.html");
await cp("src/popup/popup.css", "dist/popup/popup.css");
await build({ entryPoints: ["src/content/linkedin-job.ts"], outfile: "dist/content/linkedin-job.js", bundle: true, format: "iife", platform: "browser", target: "es2020" });
await build({ entryPoints: ["src/background/service-worker.ts"], outfile: "dist/background.js", bundle: true, format: "esm", platform: "browser", target: "es2020" });
await build({ entryPoints: ["src/popup/popup.ts"], outfile: "dist/popup/popup.js", bundle: true, format: "iife", platform: "browser", target: "es2020" });
console.log("Built extension to extension/dist");
