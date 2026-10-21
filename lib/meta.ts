import type { DailyRow } from "./types";

const GRAPH_VERSION = "v24.0";
const FIELDS = [
  "campaign_name",
  "adset_name",
  "ad_name",
  "impressions",
  "reach",
  "clicks",
  "ctr",
  "cpc",
  "frequency",
  "spend",
  "actions",
  "date_start",
  "date_stop",
].join(",");

type Action = { action_type?: string; value?: string | number };

export function extractAction(actions: unknown, type: string): number {
  if (!Array.isArray(actions)) return 0;
  for (const action of actions as Action[]) {
    if (action && action.action_type === type) {
      const value = Number(action.value ?? 0);
      return Number.isFinite(value) ? Math.round(value) : 0;
    }
  }
  return 0;
}

function num(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function rawToRow(
  raw: Record<string, unknown>,
  level: "campaign" | "ad",
): DailyRow {
  const leads = extractAction(raw.actions, "onsite_conversion.lead_grouped");
  const websiteLeads = extractAction(raw.actions, "onsite_web_lead");

  return {
    date: String(raw.date_start ?? raw.date ?? "").slice(0, 10),
    campaign: String(raw.campaign_name ?? ""),
    adset: level === "ad" ? String(raw.adset_name ?? "") : "",
    ad: level === "ad" ? String(raw.ad_name ?? "") : "",
    impressions: Math.round(num(raw.impressions)),
    reach: Math.round(num(raw.reach)),
    clicks: Math.round(num(raw.clicks)),
    spend: Math.round(num(raw.spend) * 100) / 100,
    leads,
    formLeads: Math.max(leads - websiteLeads, 0),
    websiteLeads,
    whatsappLeads: extractAction(
      raw.actions,
      "onsite_conversion.messaging_whatsapp_reply",
    ),
    messengerLeads: extractAction(
      raw.actions,
      "onsite_conversion.messaging_first_reply",
    ),
    messagingConnections: extractAction(
      raw.actions,
      "onsite_conversion.total_messaging_connection",
    ),
    frequency: Math.round(num(raw.frequency) * 10000) / 10000,
  };
}

type FetchOptions = {
  since: string;
  until: string;
  level: "campaign" | "ad";
};

export async function fetchMetaRows({
  since,
  until,
  level,
}: FetchOptions): Promise<DailyRow[]> {
  const token = process.env.META_ACCESS_TOKEN ?? process.env.ACCESS_TOKEN;
  const account = process.env.META_AD_ACCOUNT_ID ?? process.env.AD_ACCOUNT_ID;

  if (!token || !account) {
    throw new Error("Meta API credentials are not configured.");
  }

  const params = new URLSearchParams({
    fields: FIELDS,
    time_increment: "1",
    level,
    time_range: JSON.stringify({ since, until }),
    limit: "500",
  });

  let nextUrl: string | null =
    `https://graph.facebook.com/${GRAPH_VERSION}/${account}/insights?${params.toString()}`;
  const raw: Record<string, unknown>[] = [];

  for (let page = 0; nextUrl && page < 50; page += 1) {
    const response = await fetch(nextUrl, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(25_000),
    });
    const payload = (await response.json()) as {
      data?: Record<string, unknown>[];
      paging?: { next?: string };
      error?: { code?: number; message?: string };
    };

    if (!response.ok || payload.error) {
      const detail = payload.error?.message ?? `HTTP ${response.status}`;
      throw new Error(`Meta API error: ${detail}`);
    }

    raw.push(...(payload.data ?? []));
    nextUrl = payload.paging?.next ?? null;
  }

  const rows = raw
    .map((record) => rawToRow(record, level))
    .filter((row) => row.date && row.campaign);

  const deduped = new Map<string, DailyRow>();
  for (const row of rows) {
    const key =
      level === "ad"
        ? `${row.date}|${row.campaign}|${row.adset}|${row.ad}`
        : `${row.date}|${row.campaign}`;
    deduped.set(key, row);
  }

  return [...deduped.values()].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.campaign.localeCompare(b.campaign) ||
      a.ad.localeCompare(b.ad),
  );
}
