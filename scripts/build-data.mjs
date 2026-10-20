import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const OUT_DIR = path.join(ROOT, "public", "data");
const OUT_FILE = path.join(OUT_DIR, "dashboard.json");

const DAY_PATTERN = /^meta_ads_(\d{4}-\d{2}-\d{2})\.csv$/;
const AD_PATTERN = /^meta_ads_ad_level_(\d{4}-\d{2}-\d{2})\.csv$/;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const header = rows[0].map((name) => name.replace(/^\uFEFF/, "").trim());
  return rows.slice(1).filter((cells) => cells.some((cell) => cell !== "")).map((cells) => {
    const record = {};
    header.forEach((name, index) => {
      record[name] = cells[index] ?? "";
    });
    return record;
  });
}

function num(value) {
  if (value === null || value === undefined) return 0;
  const parsed = Number(String(value).replace(/[₹,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function int(value) {
  return Math.round(num(value));
}

function toRow(record, level, fallbackDate) {
  const leads = int(record.leads);
  const websiteLeads = int(record.website_leads);
  return {
    date: (record.date || fallbackDate || "").slice(0, 10),
    campaign: record.campaign_name || "",
    adset: level === "ad" ? record.adset_name || "" : "",
    ad: level === "ad" ? record.ad_name || "" : "",
    impressions: int(record.impressions),
    reach: int(record.reach),
    clicks: int(record.clicks),
    spend: Math.round(num(record.spend) * 100) / 100,
    leads,
    formLeads: Math.max(leads - websiteLeads, 0),
    websiteLeads,
    whatsappLeads: int(record.whatsapp_leads),
    messengerLeads: int(record.messenger_leads),
    messagingConnections: int(record.messaging_connections),
    frequency: Math.round(num(record.frequency) * 10000) / 10000,
  };
}

function readRows(files, level, pattern) {
  const rows = [];
  for (const file of files) {
    const match = path.basename(file).match(pattern);
    if (!match) continue;
    const records = parseCsv(fs.readFileSync(file, "utf8"));
    for (const record of records) {
      const row = toRow(record, level, match[1]);
      if (!row.date || !row.campaign) continue;
      rows.push(row);
    }
  }
  return rows;
}

function dedupe(rows, level) {
  const map = new Map();
  for (const row of rows) {
    const key = level === "ad"
      ? `${row.date}|${row.campaign}|${row.adset}|${row.ad}`
      : `${row.date}|${row.campaign}`;
    map.set(key, row);
  }
  return [...map.values()];
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + row[key], 0);
}

if (!fs.existsSync(DATA_DIR)) {
  throw new Error(`Missing data directory: ${DATA_DIR}`);
}

const files = fs.readdirSync(DATA_DIR).filter((name) => name.endsWith(".csv"));
const campaignFiles = files.filter((name) => DAY_PATTERN.test(name)).sort();
const adFiles = files.filter((name) => AD_PATTERN.test(name)).sort();

if (campaignFiles.length === 0) {
  throw new Error("No campaign CSVs found in data/. Run daily_fetch.py --backfill first.");
}

const campaign = dedupe(
  readRows(campaignFiles.map((name) => path.join(DATA_DIR, name)), "campaign", DAY_PATTERN),
  "campaign",
).sort((a, b) => a.date.localeCompare(b.date) || a.campaign.localeCompare(b.campaign));

const ads = dedupe(
  readRows(adFiles.map((name) => path.join(DATA_DIR, name)), "ad", AD_PATTERN),
  "ad",
).sort(
  (a, b) =>
    a.date.localeCompare(b.date) ||
    a.campaign.localeCompare(b.campaign) ||
    a.adset.localeCompare(b.adset) ||
    a.ad.localeCompare(b.ad),
);

if (campaign.length === 0) {
  throw new Error("Campaign CSVs were found but contained no usable rows.");
}

const dates = [...new Set(campaign.map((row) => row.date))].sort();
const minDate = dates[0];
const maxDate = dates[dates.length - 1];

const payload = {
  generatedAt: new Date().toISOString(),
  summary: {
    minDate,
    maxDate,
    days: dates.length,
    campaignRows: campaign.length,
    adRows: ads.length,
    sourceFiles: campaignFiles.length + adFiles.length,
    totals: {
      spend: Math.round(sum(campaign, "spend") * 100) / 100,
      impressions: sum(campaign, "impressions"),
      clicks: sum(campaign, "clicks"),
      leads: sum(campaign, "leads"),
    },
  },
  campaign,
  ads,
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
  `[data] ${campaign.length} campaign rows + ${ads.length} ad rows | ` +
    `${dates.length} days (${minDate} → ${maxDate}) | ${kb} KB → public/data/dashboard.json`,
);
