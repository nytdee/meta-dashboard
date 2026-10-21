import fs from "node:fs";
import path from "node:path";

export const ANALYSIS_VERSION = "creative-v1.0";

export const THRESHOLDS = {
  minSpend: 25000,
  minLeads: 60,
  minImpressions: 120000,
  minAds: 1,
  cohortMinSpend: 60000,
  cohortMinLeads: 150,
  cohortMinImpressions: 300000,
};

function ratio(numerator, denominator, scale = 1) {
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator <= 0
  ) {
    return null;
  }
  return (numerator / denominator) * scale;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function money(value) {
  if (value === null || !Number.isFinite(value)) return "unavailable";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function percent(value, digits = 0) {
  if (value === null || !Number.isFinite(value)) return "unavailable";
  return `${value.toFixed(digits)}%`;
}

function signedPercent(value) {
  if (value === null || !Number.isFinite(value)) return "unavailable";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(0)}%`;
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function creativeTags(creative) {
  return {
    hook: [creative.hookType],
    angle: creative.messagingAngles ?? [],
    proof: creative.proofTypes ?? [],
    offer: [creative.offerType],
    cta: [creative.ctaType],
    format: [creative.format],
  };
}

function sampleStatus(cohort) {
  if (
    cohort.spend >= THRESHOLDS.cohortMinSpend &&
    cohort.leads >= THRESHOLDS.cohortMinLeads &&
    cohort.impressions >= THRESHOLDS.cohortMinImpressions
  ) {
    return "sufficient";
  }
  if (cohort.spend >= THRESHOLDS.cohortMinSpend * 0.35) return "low";
  return "insufficient";
}

function readManualCreatives(dataDir) {
  const file = path.join(dataDir, "creatives.json");
  if (!fs.existsSync(file)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    const list = Array.isArray(parsed) ? parsed : parsed.creatives ?? [];
    return list.map((entry, index) => ({
      id: entry.id ?? `manual_${slug(entry.name ?? `creative_${index}`)}`,
      name: entry.name ?? `Creative ${index + 1}`,
      format: entry.format ?? "unknown/unknown",
      headline: entry.headline ?? "",
      body: entry.body ?? entry.sourceCopy ?? "",
      hookText: entry.hookText ?? "",
      hookType: entry.hookType ?? "other/unknown",
      messagingAngles: entry.messagingAngles ?? [],
      proofTypes: entry.proofTypes ?? [],
      offerType: entry.offerType ?? "other/unknown",
      ctaType: entry.ctaType ?? "unknown",
      ctaText: entry.ctaText ?? "",
      visualOpening: entry.visualOpening ?? "unknown",
      language: entry.language ?? "en",
      observed: entry.observed ?? [],
      mediaAvailable: entry.mediaAvailable ?? false,
      mediaNote:
        entry.mediaNote ??
        "No media reference available for this creative; analysis is copy-only.",
      source: "manual",
      analysisVersion: ANALYSIS_VERSION,
      adNames: entry.adNames ?? (entry.adName ? [entry.adName] : []),
    }));
  } catch (error) {
    console.warn(`[creative] could not read data/creatives.json: ${error.message}`);
    return [];
  }
}

function resolveCreatives({ ads, creatives, dataDir }) {
  const manual = readManualCreatives(dataDir);
  const byId = new Map();
  for (const creative of [...(creatives ?? []), ...manual]) {
    byId.set(creative.id, creative);
  }
  const byAdName = new Map();
  for (const creative of manual) {
    for (const adName of creative.adNames ?? []) {
      byAdName.set(adName, creative);
    }
  }
  for (const creative of creatives ?? []) {
    byAdName.set(creative.name, creative);
  }

  const resolved = new Map();
  const unmatched = new Set();

  for (const row of ads) {
    let creative = row.creativeId ? byId.get(row.creativeId) : undefined;
    if (!creative) creative = byAdName.get(row.ad);
    if (!creative) {
      unmatched.add(row.ad);
      continue;
    }
    if (!resolved.has(creative.id)) {
      resolved.set(creative.id, {
        creative,
        rows: [],
        ads: new Set(),
        campaigns: new Set(),
        dates: new Set(),
      });
    }
    const entry = resolved.get(creative.id);
    entry.rows.push(row);
    entry.ads.add(row.ad);
    entry.campaigns.add(row.campaign);
    entry.dates.add(row.date);
  }

  return { resolved, unmatched: [...unmatched] };
}

export function analyzeCreatives({
  ads,
  creatives,
  dataDir = path.join(process.cwd(), "data"),
  source = "live",
  generatedAt = new Date().toISOString(),
}) {
  const issues = [];
  const { resolved, unmatched } = resolveCreatives({ ads, creatives, dataDir });

  if (unmatched.length > 0) {
    issues.push(
      `${unmatched.length} ad name(s) have no creative metadata and were excluded from creative analysis.`,
    );
  }

  const baselineSpend = ads.reduce((sum, row) => sum + row.spend, 0);
  const baselineLeads = ads.reduce((sum, row) => sum + row.leads, 0);
  const baselineImpressions = ads.reduce(
    (sum, row) => sum + row.impressions,
    0,
  );
  const baselineClicks = ads.reduce((sum, row) => sum + row.clicks, 0);
  const baselineCtr = ratio(baselineClicks, baselineImpressions, 100);
  const baselineCpl = ratio(baselineSpend, baselineLeads);
  const baselineDays = new Set(ads.map((row) => row.date)).size;
  const baselineAds = new Set(ads.map((row) => row.ad)).size;

  if (resolved.size === 0) {
    return {
      generatedAt,
      analysisVersion: ANALYSIS_VERSION,
      source,
      mode: source === "sample" ? "demo" : "live",
      baseline: {
        spend: round2(baselineSpend),
        leads: baselineLeads,
        impressions: baselineImpressions,
        clicks: baselineClicks,
        ctr: baselineCtr === null ? null : round2(baselineCtr),
        cpl: baselineCpl === null ? null : round2(baselineCpl),
        creatives: 0,
        ads: baselineAds,
        days: baselineDays,
      },
      thresholds: THRESHOLDS,
      creatives: [],
      cohorts: [],
      issues: issues.length
        ? issues
        : [
            "No creative metadata is available for this dataset. Add data/creatives.json or connect the Meta API to enable creative analysis.",
          ],
    };
  }

  const performances = [];
  for (const [creativeId, entry] of resolved.entries()) {
    const spend = entry.rows.reduce((sum, row) => sum + row.spend, 0);
    const leads = entry.rows.reduce((sum, row) => sum + row.leads, 0);
    const impressions = entry.rows.reduce(
      (sum, row) => sum + row.impressions,
      0,
    );
    const clicks = entry.rows.reduce((sum, row) => sum + row.clicks, 0);
    const reach = entry.rows.reduce((sum, row) => sum + row.reach, 0);
    const ctr = ratio(clicks, impressions, 100);
    const cpl = ratio(spend, leads);

    const dailyMap = new Map();
    const adMap = new Map();
    for (const row of entry.rows) {
      const day = dailyMap.get(row.date) ?? {
        date: row.date,
        spend: 0,
        leads: 0,
        clicks: 0,
        impressions: 0,
      };
      day.spend += row.spend;
      day.leads += row.leads;
      day.clicks += row.clicks;
      day.impressions += row.impressions;
      dailyMap.set(row.date, day);

      const ad = adMap.get(row.ad) ?? {
        ad: row.ad,
        campaign: row.campaign,
        adset: row.adset,
        spend: 0,
        leads: 0,
        clicks: 0,
        impressions: 0,
        days: new Set(),
      };
      ad.spend += row.spend;
      ad.leads += row.leads;
      ad.clicks += row.clicks;
      ad.impressions += row.impressions;
      ad.days.add(row.date);
      adMap.set(row.ad, ad);
    }

    const daily = [...dailyMap.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((day) => ({
        date: day.date,
        spend: round2(day.spend),
        leads: day.leads,
        clicks: day.clicks,
        impressions: day.impressions,
        cpl: round2(ratio(day.spend, day.leads) ?? 0),
        ctr: round2(ratio(day.clicks, day.impressions, 100) ?? 0),
      }));

    const adBreakdown = [...adMap.values()]
      .map((ad) => ({
        ad: ad.ad,
        campaign: ad.campaign,
        adset: ad.adset,
        days: ad.days.size,
        spend: round2(ad.spend),
        leads: ad.leads,
        clicks: ad.clicks,
        impressions: ad.impressions,
        cpl: round2(ratio(ad.spend, ad.leads) ?? 0),
        ctr: round2(ratio(ad.clicks, ad.impressions, 100) ?? 0),
      }))
      .sort((a, b) => b.leads - a.leads);

    performances.push({
      creative: entry.creative,
      performance: {
        creativeId,
        name: entry.creative.name,
        campaigns: [...entry.campaigns].sort(),
        ads: [...entry.ads].sort(),
        days: entry.dates.size,
        spend: round2(spend),
        impressions,
        clicks,
        leads,
        reach,
        ctr: ctr === null ? null : round2(ctr),
        cpl: cpl === null ? null : round2(cpl),
        leadShare: 0,
        spendShare: 0,
        vsBaselineCpl:
          cpl === null || baselineCpl === null
            ? null
            : round2(((cpl - baselineCpl) / baselineCpl) * 100),
        vsBaselineCtr:
          ctr === null || baselineCtr === null
            ? null
            : round2(((ctr - baselineCtr) / baselineCtr) * 100),
      },
      daily,
      adBreakdown,
    });
  }

  for (const item of performances) {
    item.performance.leadShare = baselineLeads
      ? round2((item.performance.leads / baselineLeads) * 100)
      : 0;
    item.performance.spendShare = baselineSpend
      ? round2((item.performance.spend / baselineSpend) * 100)
      : 0;
  }

  // Tag cohorts, built from creative-level totals so a creative is counted
  // once per tag.
  const cohortMap = new Map();
  for (const item of performances) {
    const tags = creativeTags(item.creative);
    for (const [dimension, values] of Object.entries(tags)) {
      for (const tag of values) {
        if (!tag) continue;
        const key = `${dimension}:${tag}`;
        if (!cohortMap.has(key)) {
          cohortMap.set(key, {
            dimension,
            tag,
            creatives: 0,
            ads: 0,
            spend: 0,
            leads: 0,
            impressions: 0,
            clicks: 0,
          });
        }
        const cohort = cohortMap.get(key);
        cohort.creatives += 1;
        cohort.ads += item.performance.ads.length;
        cohort.spend += item.performance.spend;
        cohort.leads += item.performance.leads;
        cohort.impressions += item.performance.impressions;
        cohort.clicks += item.performance.clicks;
      }
    }
  }

  const cohorts = [...cohortMap.values()].map((cohort) => {
    const ctr = ratio(cohort.clicks, cohort.impressions, 100);
    const cpl = ratio(cohort.spend, cohort.leads);
    const enriched = {
      ...cohort,
      spend: round2(cohort.spend),
      ctr: ctr === null ? null : round2(ctr),
      cpl: cpl === null ? null : round2(cpl),
      leadShare: baselineLeads
        ? round2((cohort.leads / baselineLeads) * 100)
        : 0,
      spendShare: baselineSpend
        ? round2((cohort.spend / baselineSpend) * 100)
        : 0,
      vsBaselineCpl:
        cpl === null || baselineCpl === null
          ? null
          : round2(((cpl - baselineCpl) / baselineCpl) * 100),
      vsBaselineCtr:
        ctr === null || baselineCtr === null
          ? null
          : round2(((ctr - baselineCtr) / baselineCtr) * 100),
    };
    enriched.sampleStatus = sampleStatus(enriched);
    return enriched;
  });

  const cohortIndex = new Map(
    cohorts.map((cohort) => [`${cohort.dimension}:${cohort.tag}`, cohort]),
  );

  const insights = performances.map((item) => {
    const { creative, performance } = item;
    const rationale = [];
    const supportingCohorts = [];

    const tags = creativeTags(creative);
    for (const [dimension, values] of Object.entries(tags)) {
      for (const tag of values) {
        const cohort = cohortIndex.get(`${dimension}:${tag}`);
        if (!cohort) continue;
        supportingCohorts.push({
          dimension,
          tag,
          vsBaselineCpl: cohort.vsBaselineCpl,
          leadShare: cohort.leadShare,
          sampleStatus: cohort.sampleStatus,
        });
      }
    }
    supportingCohorts.sort(
      (a, b) => (a.vsBaselineCpl ?? 999) - (b.vsBaselineCpl ?? 999),
    );

    const enoughLeads = performance.leads >= THRESHOLDS.minLeads;
    const enoughSpend = performance.spend >= THRESHOLDS.minSpend;
    const enoughImpressions =
      performance.impressions >= THRESHOLDS.minImpressions;

    let verdict = "hold";
    if (enoughSpend && performance.leads === 0) {
      verdict = "stop";
    } else if (
      enoughLeads &&
      enoughSpend &&
      enoughImpressions &&
      performance.vsBaselineCpl !== null &&
      performance.vsBaselineCpl <= -15
    ) {
      verdict = "replicate";
    } else if (
      enoughLeads &&
      enoughSpend &&
      performance.vsBaselineCpl !== null &&
      performance.vsBaselineCpl <= 0
    ) {
      verdict = "test";
    } else if (
      enoughSpend &&
      performance.vsBaselineCpl !== null &&
      performance.vsBaselineCpl >= 25
    ) {
      verdict = "stop";
    }

    rationale.push(
      `Delivered ${performance.leads.toLocaleString("en-IN")} leads on ${money(performance.spend)} spend across ${performance.ads.length} ad(s) over ${performance.days} days.`,
    );
    if (performance.cpl !== null && baselineCpl !== null) {
      rationale.push(
        `CPL ${money(performance.cpl)} against the account baseline of ${money(baselineCpl)} (${signedPercent(performance.vsBaselineCpl)}).`,
      );
    }
    if (performance.ctr !== null && baselineCtr !== null) {
      rationale.push(
        `CTR ${percent(performance.ctr, 2)} against the account baseline of ${percent(baselineCtr, 2)} (${signedPercent(performance.vsBaselineCtr)}).`,
      );
    }
    rationale.push(
      `Carries ${percent(performance.leadShare, 1)} of account leads on ${percent(performance.spendShare, 1)} of spend.`,
    );

    const strongCohort = supportingCohorts.find(
      (cohort) =>
        cohort.sampleStatus === "sufficient" &&
        cohort.vsBaselineCpl !== null &&
        cohort.vsBaselineCpl <= -10,
    );
    if (strongCohort) {
      rationale.push(
        `Its ${strongCohort.dimension} cohort "${strongCohort.tag}" also beats the baseline (${signedPercent(strongCohort.vsBaselineCpl)} CPL on ${percent(strongCohort.leadShare, 1)} of leads), so the pattern is not unique to this ad.`,
      );
    } else {
      const weakCohort = supportingCohorts.find(
        (cohort) =>
          cohort.sampleStatus === "sufficient" &&
          cohort.vsBaselineCpl !== null &&
          cohort.vsBaselineCpl >= 15,
      );
      if (weakCohort) {
        rationale.push(
          `Its ${weakCohort.dimension} cohort "${weakCohort.tag}" is ${signedPercent(weakCohort.vsBaselineCpl)} CPL versus baseline, so the pattern itself looks weak.`,
        );
      }
    }

    if (!enoughLeads && performance.leads > 0) {
      rationale.push(
        `Sample is below the ${THRESHOLDS.minLeads}-lead threshold, so this is provisional.`,
      );
    }

    const sampleRatio = Math.min(
      1,
      Math.min(
        performance.leads / Math.max(1, THRESHOLDS.minLeads),
        performance.spend / Math.max(1, THRESHOLDS.minSpend),
        performance.impressions / Math.max(1, THRESHOLDS.minImpressions),
      ),
    );
    const volumeWeight = Math.min(1, performance.leadShare / 4);
    const breadth = performance.campaigns.length >= 2 ? 1 : 0.7;
    const confidence = round2(
      Math.min(
        0.95,
        0.45 * sampleRatio + 0.3 * volumeWeight + 0.25 * breadth,
      ),
    );
    const confidenceLabel =
      confidence >= 0.75 ? "high" : confidence >= 0.45 ? "medium" : "low";

    const proofLabel = creative.proofTypes?.[0] ?? "no recorded proof";
    const summary = `Opens on a ${creative.hookType} hook and relies on ${proofLabel}. On ${money(performance.spend)} of spend it returned ${performance.leads.toLocaleString("en-IN")} leads at ${money(performance.cpl)} per lead, ${signedPercent(performance.vsBaselineCpl)} against the account baseline of ${money(baselineCpl)}.`;

    return {
      creative: {
        ...creative,
        source: creative.source ?? (source === "sample" ? "sample" : "manual"),
        analysisVersion: creative.analysisVersion ?? ANALYSIS_VERSION,
        mediaAvailable: creative.mediaAvailable ?? false,
        mediaNote:
          creative.mediaNote ??
          "No media reference is available for this creative. Analysis uses the recorded copy only.",
      },
      performance,
      daily: item.daily,
      adBreakdown: item.adBreakdown,
      summary,
      verdict,
      confidence,
      confidenceLabel,
      rationale,
      evidence: {
        baselineCpl: baselineCpl === null ? null : round2(baselineCpl),
        baselineCtr: baselineCtr === null ? null : round2(baselineCtr),
        vsBaselineCpl: performance.vsBaselineCpl,
        vsBaselineCtr: performance.vsBaselineCtr,
        leadShare: performance.leadShare,
        spendShare: performance.spendShare,
        days: performance.days,
        ads: performance.ads.length,
        creatives: 1,
        minLeads: THRESHOLDS.minLeads,
        minSpend: THRESHOLDS.minSpend,
      },
      supportingCohorts: supportingCohorts.slice(0, 4),
    };
  });

  const order = { replicate: 0, test: 1, hold: 2, stop: 3 };
  insights.sort((a, b) => {
    if (order[a.verdict] !== order[b.verdict]) {
      return order[a.verdict] - order[b.verdict];
    }
    return b.performance.leads - a.performance.leads;
  });

  return {
    generatedAt,
    analysisVersion: ANALYSIS_VERSION,
    source,
    mode: source === "sample" ? "demo" : "live",
    baseline: {
      spend: round2(baselineSpend),
      leads: baselineLeads,
      impressions: baselineImpressions,
      clicks: baselineClicks,
      ctr: baselineCtr === null ? null : round2(baselineCtr),
      cpl: baselineCpl === null ? null : round2(baselineCpl),
      creatives: resolved.size,
      ads: baselineAds,
      days: baselineDays,
    },
    thresholds: THRESHOLDS,
    creatives: insights,
    cohorts: cohorts.sort((a, b) => {
      if (a.sampleStatus !== b.sampleStatus) {
        const rank = { sufficient: 0, low: 1, insufficient: 2 };
        return rank[a.sampleStatus] - rank[b.sampleStatus];
      }
      return b.leads - a.leads;
    }),
    issues,
  };
}

export function writeAnalysis(outputDir, analysis) {
  fs.mkdirSync(outputDir, { recursive: true });
  const file = path.join(outputDir, "creative-analysis.json");
  fs.writeFileSync(file, JSON.stringify(analysis));
  return file;
}
