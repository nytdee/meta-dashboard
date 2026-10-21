import fs from "node:fs";
import path from "node:path";

const VERSIONS = ["v24.0", "v23.0", "v22.0", "v21.0", "v20.0", "v19.0"];
const ROOT = process.cwd();

function loadEnv() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, raw] = match;
    const value = raw.replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const token =
  process.env.META_ACCESS_TOKEN || process.env.ACCESS_TOKEN || "";
const rawAccount =
  process.env.META_AD_ACCOUNT_ID || process.env.AD_ACCOUNT_ID || "";
const account = rawAccount && !rawAccount.startsWith("act_")
  ? `act_${rawAccount}`
  : rawAccount;

function redact(value) {
  return typeof value === "string"
    ? value.replace(token, "[redacted]")
    : value;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30000),
  });
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { raw: text.slice(0, 500) };
  }
  return { ok: response.ok, status: response.status, payload };
}

async function graph(version, resource, params = {}) {
  const search = new URLSearchParams(params);
  const url = `https://graph.facebook.com/${version}/${resource}?${search.toString()}`;
  return fetchJson(url);
}

function errorOf(payload) {
  return payload?.error
    ? {
        code: payload.error.code,
        type: payload.error.type,
        message: redact(payload.error.message),
      }
    : null;
}

async function pickVersion() {
  const attempts = [];
  for (const version of VERSIONS) {
    try {
      const result = await graph(version, "me", { fields: "id,name" });
      if (result.ok && result.payload?.id) {
        return {
          version,
          identity: result.payload,
          attempts: attempts.length + 1,
          attempt_details: attempts,
        };
      }
      attempts.push({
        version,
        status: result.status,
        error: errorOf(result.payload) ?? { message: "No id returned" },
      });
    } catch (error) {
      attempts.push({
        version,
        status: null,
        error: { message: error instanceof Error ? error.message : "Request failed" },
      });
    }
  }
  return {
    version: null,
    identity: null,
    attempts: VERSIONS.length,
    attempt_details: attempts,
  };
}

function dateOffset(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function summarizeFields(rows, fields) {
  const present = {};
  for (const field of fields) {
    present[field] = rows.some((row) => row[field] !== undefined && row[field] !== null);
  }
  return present;
}

function mediaCheck(ads) {
  return ads.slice(0, 3).map((ad) => {
    const creative = ad.creative ?? {};
    return {
      ad_id: ad.id,
      has_body: Boolean(creative.body),
      body_length: creative.body ? creative.body.length : 0,
      has_title: Boolean(creative.title),
      cta_type: creative.call_to_action_type ?? null,
      object_type: creative.object_type ?? null,
      has_image_url: Boolean(creative.image_url),
      has_video_id: Boolean(creative.video_id),
      has_thumbnail_url: Boolean(creative.thumbnail_url),
      has_object_story_spec: Boolean(creative.object_story_spec),
      has_asset_feed_spec: Boolean(creative.asset_feed_spec),
    };
  });
}

async function main() {
  const report = {
    credentials: {
      token_present: Boolean(token),
      token_length: token.length,
      account_present: Boolean(account),
      account,
    },
    api: {},
    account: {},
    insights: {},
    creative: {},
    errors: [],
  };

  if (!token || !account) {
    report.errors.push("Missing Meta credentials in .env");
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = 1;
    return;
  }

  const { version, identity, attempts, attempt_details } = await pickVersion();
  report.api = {
    version,
    attempts,
    identity: identity ? { id: identity.id, name: identity.name } : null,
    attempt_details,
  };
  if (!version) {
    report.errors.push("No Graph API version responded to /me");
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = 1;
    return;
  }

  const accountResult = await graph(version, account, {
    fields:
      "name,account_id,currency,timezone_name,account_status,ads_running,business{id,name}",
  });
  if (accountResult.ok) {
    const data = accountResult.payload;
    report.account = {
      ok: true,
      name: data.name,
      account_id: data.account_id,
      currency: data.currency,
      timezone: data.timezone_name,
      status: data.account_status,
      ads_running: data.ads_running,
      business: data.business ?? null,
    };
  } else {
    report.account = { ok: false, status: accountResult.status, error: errorOf(accountResult.payload) };
    report.errors.push("Account metadata read failed");
  }

  const since = dateOffset(-8);
  const until = dateOffset(-1);
  const insightsFields = [
    "spend",
    "impressions",
    "reach",
    "clicks",
    "inline_link_clicks",
    "outbound_clicks",
    "actions",
    "action_values",
    "date_start",
    "date_stop",
  ].join(",");
  const insightsResult = await graph(version, `${account}/insights`, {
    fields: insightsFields,
    level: "campaign",
    time_increment: "1",
    time_range: JSON.stringify({ since, until }),
    limit: "10",
  });

  if (insightsResult.ok) {
    const rows = insightsResult.payload.data ?? [];
    const actionTypes = new Set();
    const actionValueTypes = new Set();
    for (const row of rows) {
      for (const action of row.actions ?? []) actionTypes.add(action.action_type);
      for (const action of row.action_values ?? []) actionValueTypes.add(action.action_type);
    }
    report.insights = {
      ok: true,
      since,
      until,
      rows: rows.length,
      field_presence: summarizeFields(rows, [
        "spend",
        "impressions",
        "reach",
        "clicks",
        "inline_link_clicks",
        "outbound_clicks",
        "actions",
        "action_values",
        "date_start",
        "date_stop",
      ]),
      sample_action_types: [...actionTypes].slice(0, 30),
      sample_action_value_types: [...actionValueTypes].slice(0, 20),
    };
  } else {
    report.insights = {
      ok: false,
      status: insightsResult.status,
      error: errorOf(insightsResult.payload),
    };
    report.errors.push("Insights read failed");
  }

  const adsResult = await graph(version, `${account}/ads`, {
    fields:
      "id,name,status,effective_status,campaign{id,name,objective},adset{id,name},creative{id,name,body,title,call_to_action_type,object_type,image_url,video_id,thumbnail_url,object_story_spec,asset_feed_spec}",
    limit: "5",
  });
  if (adsResult.ok) {
    const ads = adsResult.payload.data ?? [];
    report.creative = {
      ok: true,
      ads: ads.length,
      field_presence: summarizeFields(ads, [
        "id",
        "name",
        "status",
        "effective_status",
        "campaign",
        "adset",
        "creative",
      ]),
      creative_field_presence: (() => {
        const creatives = ads.map((ad) => ad.creative ?? {});
        return summarizeFields(creatives, [
          "id",
          "name",
          "body",
          "title",
          "call_to_action_type",
          "object_type",
          "image_url",
          "video_id",
          "thumbnail_url",
          "object_story_spec",
          "asset_feed_spec",
        ]);
      })(),
      media: mediaCheck(ads),
    };
  } else {
    report.creative = {
      ok: false,
      status: adsResult.status,
      error: errorOf(adsResult.payload),
    };
    report.errors.push("Creative/ads read failed");
  }

  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.errors.length > 0 ? 1 : 0;
}

await main();
