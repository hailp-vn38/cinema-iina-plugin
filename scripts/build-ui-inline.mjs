import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const outdir = resolve(root, "dist/ui");
const indexHtmlPath = resolve(outdir, "index.html");

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

function readText(path) {
  return readFileSync(path, "utf-8");
}

function readBuiltAsset(path) {
  try {
    return readText(path);
  } catch (error) {
    const latestHtml = existsSync(indexHtmlPath) ? readText(indexHtmlPath) : "";
    if (isAlreadyInlined(latestHtml)) {
      return null;
    }

    throw error;
  }
}

function parseAssetPaths(html) {
  const scriptMatch = html.match(/<script[^>]+src="([^"]+index-[^"]+\.js)"/i);
  const cssMatch = html.match(/<link[^>]+href="([^"]+index-[^"]+\.css)"/i);

  return {
    jsHref: scriptMatch ? scriptMatch[1] : "",
    cssHref: cssMatch ? cssMatch[1] : "",
  };
}

function isAlreadyInlined(html) {
  return (
    !html.includes('src="./assets/') &&
    !html.includes('href="./assets/') &&
    html.includes("<style>") &&
    html.includes("<script>")
  );
}

function resolveAssetPath(assetHref) {
  return resolve(outdir, assetHref.replace(/^\.\//, ""));
}

function getBuiltAssets() {
  const html = readText(indexHtmlPath);
  const { jsHref, cssHref } = parseAssetPaths(html);

  if (!jsHref || !cssHref) {
    if (isAlreadyInlined(html)) {
      return {
        alreadyInlined: true,
      };
    }

    throw new Error("Missing JS or CSS reference in Vite index.html");
  }

  const jsPath = resolveAssetPath(jsHref);
  const cssPath = resolveAssetPath(cssHref);

  if (!existsSync(jsPath) || !existsSync(cssPath)) {
    const latestHtml = readText(indexHtmlPath);
    if (isAlreadyInlined(latestHtml)) {
      return {
        alreadyInlined: true,
      };
    }

    throw new Error(
      "Built assets were removed before inlining completed: " +
        [!existsSync(jsPath) ? jsPath : null, !existsSync(cssPath) ? cssPath : null]
          .filter(Boolean)
          .join(", "),
    );
  }

  return {
    alreadyInlined: false,
    jsPath,
    cssPath,
  };
}

const builtAssets = getBuiltAssets();

if (builtAssets.alreadyInlined) {
  console.log("UI already inlined by another build process.");
  process.exit(0);
}

console.log(
  "Found JS:",
  builtAssets.jsPath.split("/").pop(),
  "CSS:",
  builtAssets.cssPath.split("/").pop(),
);

const js = readBuiltAsset(builtAssets.jsPath);
const css = readBuiltAsset(builtAssets.cssPath);

if (js === null || css === null) {
  console.log("UI already inlined by another build process.");
  process.exit(0);
}

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

writeFileSync(indexHtmlPath, html);
rmSync(resolve(outdir, "assets"), { recursive: true, force: true });
console.log("Created inline index.html, removed assets/");
