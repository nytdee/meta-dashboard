import { formatShort } from "./format";
import type {
  BreakdownLevel,
  BreakdownRow,
  DailyPoint,
  DailyRow,
  Metrics,
} from "./types";

export const EMPTY_METRICS: Metrics = {
  leads: 0,
  spend: 0,
  clicks: 0,
  impressions: 0,
  reach: 0,
  formLeads: 0,
  websiteLeads: 0,
  whatsappLeads: 0,
  messengerLeads: 0,
  messagingConnections: 0,
  cpl: null,
  ctr: null,
  cpm: null,
  frequency: null,
};

export function filterRows(
  rows: DailyRow[],
  from: string,
  to: string,
  campaigns: string[],
): DailyRow[] {
  if (campaigns.length === 0) return [];
  const selected = new Set(campaigns);
  return rows.filter(
    (row) => row.date >= from && row.date <= to && selected.has(row.campaign),
  );
}

function sum(rows: DailyRow[], key: keyof DailyRow): number {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

export function aggregate(rows: DailyRow[]): Metrics {
  if (rows.length === 0) return { ...EMPTY_METRICS };
  const leads = sum(rows, "leads");
  const spend = sum(rows, "spend");
  const clicks = sum(rows, "clicks");
  const impressions = sum(rows, "impressions");
  const reach = sum(rows, "reach");
  return {
    leads,
    spend,
    clicks,
    impressions,
    reach,
    formLeads: sum(rows, "formLeads"),
    websiteLeads: sum(rows, "websiteLeads"),
    whatsappLeads: sum(rows, "whatsappLeads"),
    messengerLeads: sum(rows, "messengerLeads"),
    messagingConnections: sum(rows, "messagingConnections"),
    cpl: leads > 0 ? spend / leads : null,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : null,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : null,
    frequency: reach > 0 ? impressions / reach : null,
  };
}

export function dailySeries(rows: DailyRow[]): DailyPoint[] {
  const byDate = new Map<string, DailyRow[]>();
  for (const row of rows) {
    const bucket = byDate.get(row.date);
    if (bucket) bucket.push(row);
    else byDate.set(row.date, [row]);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayRows]) => {
      const totals = aggregate(dayRows);
      return {
        date,
        label: formatShort(date),
        leads: totals.leads,
        spend: totals.spend,
        clicks: totals.clicks,
        impressions: totals.impressions,
        reach: totals.reach,
        cpl: totals.cpl,
        ctr: totals.ctr,
      };
    });
}

function groupKey(row: DailyRow, level: BreakdownLevel): string {
  if (level === "campaign") return row.campaign;
  if (level === "adset") return `${row.campaign}\u0000${row.adset}`;
  return `${row.campaign}\u0000${row.adset}\u0000${row.ad}`;
}

export function breakdown(rows: DailyRow[], level: BreakdownLevel): BreakdownRow[] {
  const groups = new Map<string, BreakdownRow>();

  for (const row of rows) {
    const key = groupKey(row, level);
    const current = groups.get(key);
    if (current) {
      current.leads += row.leads;
      current.spend += row.spend;
      current.clicks += row.clicks;
      current.impressions += row.impressions;
      current.reach += row.reach;
    } else {
      groups.set(key, {
        key,
        campaign: row.campaign,
        adset: level === "campaign" ? "" : row.adset,
        ad: level === "ad" ? row.ad : "",
        leads: row.leads,
        spend: row.spend,
        clicks: row.clicks,
        impressions: row.impressions,
        reach: row.reach,
        ctr: null,
        cpl: null,
      });
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      spend: Math.round(group.spend * 100) / 100,
      cpl: group.leads > 0 ? group.spend / group.leads : null,
      ctr: group.impressions > 0 ? (group.clicks / group.impressions) * 100 : null,
    }))
    .sort((a, b) => b.leads - a.leads || a.spend - b.spend);
}

export function quantile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}
