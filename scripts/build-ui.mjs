import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["vite", "build", "--config", "vite.config.mjs"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
