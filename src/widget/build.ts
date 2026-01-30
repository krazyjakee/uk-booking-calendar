import * as esbuild from "esbuild";
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outfile = resolve(__dirname, "../../public/widget.js");
const isWatch = process.argv.includes("--watch");

const buildOptions: esbuild.BuildOptions = {
  entryPoints: [resolve(__dirname, "index.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020"],
  outfile,
  jsx: "automatic",
  jsxImportSource: "preact",
  alias: {
    "react": "preact/compat",
    "react-dom": "preact/compat",
  },
  treeShaking: true,
  legalComments: "none",
  tsconfig: resolve(__dirname, "tsconfig.json"),
};

async function build() {
  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log("Widget: watching for changes…");
  } else {
    await esbuild.build(buildOptions);

    const raw = readFileSync(outfile);
    const gzipped = gzipSync(raw);
    const rawKB = (raw.length / 1024).toFixed(1);
    const gzipKB = (gzipped.length / 1024).toFixed(1);

    console.log(`Widget: ${rawKB} KB (${gzipKB} KB gzipped) → ${outfile}`);

    if (gzipped.length > 50 * 1024) {
      console.error(`Widget exceeds 50 KB gzipped limit (${gzipKB} KB)`);
      process.exit(1);
    }
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
