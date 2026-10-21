import path from "node:path";
import {
  DAY_PATTERN,
  AD_PATTERN,
  parseCsv,
  int,
  toRow,
  loadLiveDataset,
  sum,
  daysBetween,
} from "./lib/dataset.mjs";
import fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), "data");
const live = loadLiveDataset(DATA_DIR);
const today = new Date().toISOString().slice(0, 10);

const issues = [];
const addIssue = (severity, code, message, samples = [], count = samples.length) => {
  if (count === 0) return;
  issues.push({ severity, code, message, count, samples: samples.slice(0, 5) });
};

function filesWithPattern(pattern) {
  return live.files.filter((name) => pattern.test(name)).sort();
}

function auditFile(file, level, pattern) {
  const match = path.basename(file).match(pattern);
  const expectedDate = match?.[1];
  const records = parseCsv(
    fs.readFileSync(path.join(DATA_DIR, file), "utf8"),
  );
  const keys = new Map();
  let invalidRows = 0;
  let wrongDate = 0;
  let missingName = 0;
  let negative = 0;
  let clickOverImpression = 0;
  let reachOverImpression = 0;
  let leadSplitMismatch = 0;
  let storedFormMismatch = 0;
  let frequencyMismatch = 0;

  for (const record of records) {
    const row = toRow(record, level, expectedDate);
    if (!row.date || !row.campaign) invalidRows += 1;
    if (expectedDate && row.date !== expectedDate) wrongDate += 1;
    if (!row.campaign) missingName += 1;
    if (level === "ad" && (!row.adset || !row.ad)) missingName += 1;

    for (const key of [
      "impressions",
      "reach",
      "clicks",
      "spend",
      "leads",
      "websiteLeads",
      "whatsappLeads",
      "messengerLeads",
      "messagingConnections",
    ]) {
      if (row[key] < 0) {
        negative += 1;
        break;
      }
    }

    if (row.clicks > row.impressions) clickOverImpression += 1;
    if (row.reach > row.impressions) reachOverImpression += 1;
    if (row.formLeads + row.websiteLeads !== row.leads) leadSplitMismatch += 1;
    if (row.websiteLeads > row.leads) leadSplitMismatch += 1;
    if (record.form_leads !== undefined && record.form_leads !== "") {
      if (int(record.form_leads) !== row.formLeads) storedFormMismatch += 1;
    }
    if (row.reach > 0) {
      const expectedFrequency = row.impressions / row.reach;
      if (Math.abs(row.frequency - expectedFrequency) > 0.01) {
        frequencyMismatch += 1;
      }
    }

    const key =
      level === "ad"
        ? `${row.date}|${row.campaign}|${row.adset}|${row.ad}`
        : `${row.date}|${row.campaign}`;
    keys.set(key, (keys.get(key) ?? 0) + 1);
  }

  const duplicateKeys = [...keys.entries()].filter(([, count]) => count > 1);

  addIssue(
    "critical",
    `${level}_invalid_rows`,
    `${file}: rows missing date or campaign`,
    records.slice(0, 5).map((record) => record.campaign_name || record.date || "(blank)"),
    invalidRows,
  );
  addIssue(
    "critical",
    `${level}_wrong_file_date`,
    `${file}: row date differs from filename date`,
    [],
    wrongDate,
  );
  addIssue(
    "critical",
    `${level}_missing_name`,
    `${file}: rows missing campaign/adset/ad name`,
    [],
    missingName,
  );
  addIssue(
    "critical",
    `${level}_negative_values`,
    `${file}: rows with negative metrics`,
    [],
    negative,
  );
  addIssue(
    "warning",
    `${level}_clicks_over_impressions`,
    `${file}: rows where clicks exceed impressions`,
    [],
    clickOverImpression,
  );
  addIssue(
    "warning",
    `${level}_reach_over_impressions`,
    `${file}: rows where reach exceeds impressions`,
    [],
    reachOverImpression,
  );
  addIssue(
    "critical",
    `${level}_lead_split_mismatch`,
    `${file}: form + website leads do not equal total leads`,
    [],
    leadSplitMismatch,
  );
  addIssue(
    "warning",
    `${level}_stored_form_mismatch`,
    `${file}: stored form_leads differs from leads - website_leads`,
    [],
    storedFormMismatch,
  );
  addIssue(
    "warning",
    `${level}_frequency_mismatch`,
    `${file}: frequency differs from impressions / reach`,
    [],
    frequencyMismatch,
  );
  addIssue(
    "critical",
    `${level}_duplicate_keys`,
    `${file}: duplicate entity/date keys`,
    duplicateKeys.slice(0, 5).map(([key, count]) => `${key} (${count})`),
    duplicateKeys.length,
  );

  return {
    file,
    rows: records.length,
    invalidRows,
    duplicateKeys: duplicateKeys.length,
    wrongDate,
  };
}

const campaignFiles = filesWithPattern(DAY_PATTERN).map((file) =>
  path.join(DATA_DIR, file),
);
const adFiles = filesWithPattern(AD_PATTERN).map((file) =>
  path.join(DATA_DIR, file),
);

const campaignFileResults = filesWithPattern(DAY_PATTERN).map((file) =>
  auditFile(file, "campaign", DAY_PATTERN),
);
const adFileResults = filesWithPattern(AD_PATTERN).map((file) =>
  auditFile(file, "ad", AD_PATTERN),
);

const missingDates = [];
if (live.minDate && live.maxDate) {
  for (
    let cursor = live.minDate;
    cursor <= live.maxDate;
    cursor = new Date(Date.parse(`${cursor}T00:00:00Z`) + 86_400_000)
      .toISOString()
      .slice(0, 10)
  ) {
    if (!live.dates.includes(cursor)) missingDates.push(cursor);
  }
}
addIssue(
  "warning",
  "missing_dates",
  "Dates missing between the first and last live CSV",
  missingDates,
  missingDates.length,
);

const metrics = ["spend", "impressions", "clicks", "leads", "reach"];
const totals = {
  campaign: Object.fromEntries(metrics.map((key) => [key, sum(live.campaign, key)])),
  ads: Object.fromEntries(metrics.map((key) => [key, sum(live.ads, key)])),
};
const diff = Object.fromEntries(
  metrics.map((key) => [key, totals.campaign[key] - totals.ads[key]]),
);

const tolerances = {
  spend: 1,
  impressions: 5,
  clicks: 0,
  leads: 0,
  reach: Number.POSITIVE_INFINITY,
};
for (const key of metrics) {
  if (Math.abs(diff[key]) > tolerances[key]) {
    addIssue(
      "critical",
      `campaign_vs_ad_${key}`,
      `Campaign vs ad-level ${key} totals differ by ${diff[key]}`,
      [],
      1,
    );
  }
}
if (diff.reach !== 0) {
  addIssue(
    "info",
    "reach_not_additive",
    `Campaign and ad reach totals differ by ${diff.reach}; reach is not additive across overlapping ads/dates.`,
    [],
    1,
  );
}

const byDate = new Map();
for (const row of live.campaign) {
  const bucket = byDate.get(row.date) ?? { campaign: {}, ads: {} };
  bucket.campaign[row.campaign] = row;
  byDate.set(row.date, bucket);
}
for (const row of live.ads) {
  const bucket = byDate.get(row.date) ?? { campaign: {}, ads: {} };
  bucket.ads[`${row.campaign}|${row.adset}|${row.ad}`] = row;
  byDate.set(row.date, bucket);
}
const dateDiffs = [];
for (const [date, bucket] of byDate) {
  const campaignTotals = Object.fromEntries(
    metrics.map((key) => [
      key,
      sum(Object.values(bucket.campaign), key),
    ]),
  );
  const adTotals = Object.fromEntries(
    metrics.map((key) => [key, sum(Object.values(bucket.ads), key)]),
  );
  const dayDiff = Object.fromEntries(
    metrics.map((key) => [key, campaignTotals[key] - adTotals[key]]),
  );
  if (
    Math.abs(dayDiff.spend) > 1 ||
    Math.abs(dayDiff.impressions) > 5 ||
    dayDiff.clicks !== 0 ||
    dayDiff.leads !== 0
  ) {
    dateDiffs.push({ date, ...dayDiff });
  }
}
addIssue(
  "critical",
  "campaign_vs_ad_by_date",
  "Dates where campaign and ad-level totals differ",
  dateDiffs.slice(0, 5).map((item) => JSON.stringify(item)),
  dateDiffs.length,
);

const critical = issues.filter((issue) => issue.severity === "critical");
const warnings = issues.filter((issue) => issue.severity === "warning");

const report = {
  generatedAt: new Date().toISOString(),
  coverage: {
    campaignFiles: campaignFiles.length,
    adFiles: adFiles.length,
    minDate: live.minDate,
    maxDate: live.maxDate,
    days: live.dates.length,
    missingDates,
    staleDays: live.maxDate ? daysBetween(live.maxDate, today) : null,
    isStale: !live.maxDate || daysBetween(live.maxDate, today) > 7,
  },
  rows: {
    rawCampaign: live.rawCampaign.length,
    uniqueCampaign: live.campaign.length,
    rawAds: live.rawAds.length,
    uniqueAds: live.ads.length,
  },
  totals,
  diff,
  dateDiffs,
  issues,
  summary: {
    critical: critical.length,
    warnings: warnings.length,
  },
  fileResults: {
    campaign: campaignFileResults,
    ads: adFileResults,
  },
};

console.log(JSON.stringify(report, null, 2));
process.exitCode = critical.length > 0 ? 1 : 0;
