import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const outdir = resolve(root, "dist/runtime");

mkdirSync(outdir, { recursive: true });

await build({
  entryPoints: [resolve(root, "src/runtime/index.ts")],
  outfile: resolve(outdir, "index.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2019",
  charset: "utf8",
  logLevel: "info",
});
