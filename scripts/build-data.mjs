import fs from "node:fs";
import path from "node:path";
import { generateSampleRows } from "./sample-data.mjs";
import {
  loadLiveDataset,
  sortAdRows,
  sortCampaignRows,
  sum,
  daysBetween,
} from "./lib/dataset.mjs";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const OUT_DIR = path.join(ROOT, "public", "data");
const OUT_FILE = path.join(OUT_DIR, "dashboard.json");

const SAMPLE_DAYS = 90;
const STALE_DAYS = 7;

const cliSource = process.argv
  .slice(2)
  .map((argument) => argument.replace(/^--/, "").toLowerCase())
  .find((argument) => ["auto", "live", "sample"].includes(argument));
const requestedSource = (
  process.env.DATA_SOURCE ||
  cliSource ||
  "auto"
).toLowerCase();

if (!["auto", "live", "sample"].includes(requestedSource)) {
  throw new Error(
    `DATA_SOURCE must be auto, live or sample (got "${requestedSource}")`,
  );
}

const live = loadLiveDataset(DATA_DIR);
const today = new Date().toISOString().slice(0, 10);
const liveMaxDate = live.maxDate;
const liveIsStale =
  !liveMaxDate || daysBetween(liveMaxDate, today) > STALE_DAYS;

let source = requestedSource;
if (source === "auto") {
  // Never silently replace stale live data with generated data. Use live rows
  // whenever any exist and surface staleness in the UI; sample data is only
  // used when no live export exists (or when explicitly requested).
  source = live.campaign.length > 0 ? "live" : "sample";
}

if (source === "live" && live.campaign.length === 0) {
  throw new Error(
    "DATA_SOURCE=live but no usable campaign CSVs were found in data/. " +
      "Run daily_fetch.py --backfill or use `npm run data:sample` for demo data.",
  );
}

const sample =
  source === "sample"
    ? generateSampleRows({ endDate: today, days: SAMPLE_DAYS })
    : null;
const campaign = sortCampaignRows(
  sample ? sample.campaignRows : live.campaign,
);
const ads = sortAdRows(sample ? sample.adRows : live.ads);

if (campaign.length === 0) {
  throw new Error("No usable campaign rows were found.");
}

const dates = [...new Set(campaign.map((row) => row.date))].sort();
const minDate = dates[0];
const maxDate = dates[dates.length - 1];
const stale = source === "live" && liveIsStale;

const presentDates = new Set(dates);
const missingDates = [];
const cursor = new Date(`${minDate}T00:00:00Z`);
const rangeEnd = new Date(`${maxDate}T00:00:00Z`);
while (cursor <= rangeEnd) {
  const iso = cursor.toISOString().slice(0, 10);
  if (!presentDates.has(iso)) missingDates.push(iso);
  cursor.setUTCDate(cursor.getUTCDate() + 1);
}

const payload = {
  generatedAt: new Date().toISOString(),
  summary: {
    minDate,
    maxDate,
    days: dates.length,
    campaignRows: campaign.length,
    adRows: ads.length,
    sourceFiles:
      source === "sample" ? 0 : live.campaignFiles.length + live.adFiles.length,
    source,
    stale,
    staleDays: stale && liveMaxDate ? daysBetween(liveMaxDate, today) : null,
    liveMaxDate,
    missingDates,
    totals: {
      spend: Math.round(sum(campaign, "spend") * 100) / 100,
      impressions: sum(campaign, "impressions"),
      clicks: sum(campaign, "clicks"),
      leads: sum(campaign, "leads"),
    },
  },
  campaign,
  ads,
  creatives: sample ? sample.creatives : [],
};

const checks = [
  ["spend", 1],
  ["impressions", 1],
  ["clicks", 1],
  ["leads", 0],
];
for (const [key, tolerance] of checks) {
  const diff = Math.abs(sum(campaign, key) - sum(ads, key));
  if (diff > tolerance) {
    console.warn(`[data] Warning: campaign vs ad ${key} totals differ by ${diff}`);
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(payload));

const kb = Math.round(Buffer.byteLength(fs.readFileSync(OUT_FILE)) / 1024);
console.log(
  `[data] ${source.toUpperCase()} ${campaign.length} campaign rows + ${ads.length} ad rows | ` +
    `${dates.length} days (${minDate} → ${maxDate}) | ${kb} KB → public/data/dashboard.json`,
);
if (source === "sample") {
  console.log(
    `[data] DEMO MODE: generated sample data${liveMaxDate ? ` (live CSV ends ${liveMaxDate})` : " (no live CSVs)"}.`,
  );
} else if (stale) {
  console.warn(
    `[data] STALE LIVE DATA: newest CSV is ${liveMaxDate} (${daysBetween(liveMaxDate, today)} days old). ` +
      "The dashboard will show a stale-data warning.",
  );
}
