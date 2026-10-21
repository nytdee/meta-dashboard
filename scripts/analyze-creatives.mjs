import fs from "node:fs";
import path from "node:path";
import { analyzeCreatives, writeAnalysis } from "./lib/creative-analysis.mjs";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const OUT_DIR = path.join(ROOT, "public", "data");
const DASHBOARD_FILE = path.join(OUT_DIR, "dashboard.json");

if (!fs.existsSync(DASHBOARD_FILE)) {
  throw new Error(
    "public/data/dashboard.json is missing. Run `npm run data:sample` first.",
  );
}

const dashboard = JSON.parse(fs.readFileSync(DASHBOARD_FILE, "utf8"));
const ads = dashboard.ads ?? [];
const creatives = dashboard.creatives ?? [];

const analysis = analyzeCreatives({
  ads,
  creatives,
  dataDir: DATA_DIR,
  source: dashboard.summary?.source ?? "live",
});

const file = writeAnalysis(OUT_DIR, analysis);

const replicate = analysis.creatives.filter(
  (item) => item.verdict === "replicate",
).length;
const stop = analysis.creatives.filter((item) => item.verdict === "stop").length;

console.log(
  `[creative] ${analysis.baseline.creatives} creatives analysed | ` +
    `${replicate} replicate candidates | ${stop} flagged for review | ` +
    `${analysis.cohorts.length} tag cohorts → ${path.relative(ROOT, file)}`,
);

for (const issue of analysis.issues) {
  console.warn(`[creative] ${issue}`);
}
