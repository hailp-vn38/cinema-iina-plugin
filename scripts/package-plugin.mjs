import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const buildRoot = resolve(root, ".build/plugin");
const releaseRoot = resolve(root, "dist/releases");

const requiredPaths = [
  resolve(root, "Info.json"),
  resolve(root, "pref.html"),
  resolve(root, "dist/runtime/index.js"),
  resolve(root, "dist/ui/index.html"),
];

for (const requiredPath of requiredPaths) {
  if (!existsSync(requiredPath)) {
    console.error("Missing required packaging input:", requiredPath);
    process.exit(1);
  }
}

rmSync(buildRoot, { recursive: true, force: true });
mkdirSync(buildRoot, { recursive: true });
mkdirSync(releaseRoot, { recursive: true });

cpSync(resolve(root, "Info.json"), resolve(buildRoot, "Info.json"));
cpSync(resolve(root, "pref.html"), resolve(buildRoot, "pref.html"));
mkdirSync(resolve(buildRoot, "src/runtime"), { recursive: true });
cpSync(resolve(root, "dist/runtime/index.js"), resolve(buildRoot, "src/runtime/index.js"));
cpSync(resolve(root, "dist/ui"), resolve(buildRoot, "ui"), { recursive: true });

const archivePath = resolve(releaseRoot, "iina-plugin-next.iinaplgz");
rmSync(archivePath, { force: true });

const zipResult = spawnSync(
  "zip",
  ["-rq", archivePath, "Info.json", "pref.html", "src", "ui"],
  {
    cwd: buildRoot,
    stdio: "inherit",
  }
);

if (zipResult.status !== 0) {
  process.exit(zipResult.status ?? 1);
}

console.log("Created", archivePath);
