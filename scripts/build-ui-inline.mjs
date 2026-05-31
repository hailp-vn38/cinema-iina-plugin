import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const outdir = resolve(root, "dist/ui");

// Step 1: Run Vite build
console.log("Building with Vite...");
const viteResult = spawnSync(
  "npx",
  ["vite", "build", "--config", "vite.config.mjs"],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

if (viteResult.status !== 0) {
  process.exit(viteResult.status ?? 1);
}

// Step 2: Find built JS and CSS files
const assetsDir = resolve(outdir, "assets");
const files = readdirSync(assetsDir);
const jsFile = files.find((f) => f.startsWith("index-") && f.endsWith(".js"));
const cssFile = files.find((f) => f.startsWith("index-") && f.endsWith(".css"));

if (!jsFile || !cssFile) {
  console.error("Missing JS or CSS file in assets");
  process.exit(1);
}

console.log("Found JS:", jsFile, "CSS:", cssFile);

// Step 3: Read built files
const js = readFileSync(resolve(assetsDir, jsFile), "utf-8");
const css = readFileSync(resolve(assetsDir, cssFile), "utf-8");

// Step 4: Create inline HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cinema Sources</title>
  <style>
${css}
  </style>
</head>
<body>
  <div id="root">
    <div style="padding: 20px; font-family: sans-serif; color: #333;">
      <p>React initializing...</p>
    </div>
  </div>
  <script>
${js}
  </script>
</body>
</html>`;

// Step 5: Write inline HTML, remove assets
writeFileSync(resolve(outdir, "index.html"), html);
rmSync(assetsDir, { recursive: true, force: true });
console.log("Created inline index.html, removed assets/");
