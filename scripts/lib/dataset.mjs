import fs from "node:fs";
import path from "node:path";

export const DAY_PATTERN = /^meta_ads_(\d{4}-\d{2}-\d{2})\.csv$/;
export const AD_PATTERN = /^meta_ads_ad_level_(\d{4}-\d{2}-\d{2})\.csv$/;

export function parseCsv(text) {
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
  return rows
    .slice(1)
    .filter((cells) => cells.some((cell) => cell !== ""))
    .map((cells) => {
      const record = {};
      header.forEach((name, index) => {
        record[name] = cells[index] ?? "";
      });
      return record;
    });
}

export function num(value) {
  if (value === null || value === undefined) return 0;
  const parsed = Number(String(value).replace(/[₹,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function int(value) {
  return Math.round(num(value));
}

export function toRow(record, level, fallbackDate) {
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

export function readRows(files, level, pattern) {
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

export function dedupe(rows, level) {
  const map = new Map();
  for (const row of rows) {
    const key =
      level === "ad"
        ? `${row.date}|${row.campaign}|${row.adset}|${row.ad}`
        : `${row.date}|${row.campaign}`;
    map.set(key, row);
  }
  return [...map.values()];
}

export function sum(rows, key) {
  return rows.reduce((total, row) => total + row[key], 0);
}

export function daysBetween(from, to) {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000,
  );
}

export function sortCampaignRows(rows) {
  return [...rows].sort(
    (a, b) => a.date.localeCompare(b.date) || a.campaign.localeCompare(b.campaign),
  );
}

export function sortAdRows(rows) {
  return [...rows].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.campaign.localeCompare(b.campaign) ||
      a.adset.localeCompare(b.adset) ||
      a.ad.localeCompare(b.ad),
  );
}

export function loadLiveDataset(dataDir) {
  const files = fs.existsSync(dataDir)
    ? fs.readdirSync(dataDir).filter((name) => name.endsWith(".csv"))
    : [];
  const campaignFiles = files.filter((name) => DAY_PATTERN.test(name)).sort();
  const adFiles = files.filter((name) => AD_PATTERN.test(name)).sort();
  const rawCampaign = readRows(
    campaignFiles.map((name) => path.join(dataDir, name)),
    "campaign",
    DAY_PATTERN,
  );
  const rawAds = readRows(
    adFiles.map((name) => path.join(dataDir, name)),
    "ad",
    AD_PATTERN,
  );
  const campaign = dedupe(rawCampaign, "campaign");
  const ads = dedupe(rawAds, "ad");
  const dates = [...new Set(campaign.map((row) => row.date))].sort();
  return {
    files,
    campaignFiles,
    adFiles,
    rawCampaign,
    rawAds,
    campaign,
    ads,
    dates,
    minDate: dates[0] ?? null,
    maxDate: dates[dates.length - 1] ?? null,
  };
}
