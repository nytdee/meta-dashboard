import { fmt, money, percent } from "./format";
import type { BreakdownRow } from "./types";

export const CPL_CEILING = 150;
export const CTR_FLOOR = 1.1;
export const CPL_WARN_RATIO = 1.2;
export const CPL_BAD_RATIO = 1.5;
export const CTR_WARN_RATIO = 0.9;
export const CTR_BAD_RATIO = 0.75;
export const WINNER_MIN_LEADS = 20;
const MIN_LEADS_FOR_CPL = 5;
const MIN_IMPRESSIONS_FOR_CTR = 1000;

export interface CampaignBenchmark {
  cpl: number | null;
  ctr: number | null;
  spend: number;
  leads: number;
  impressions: number;
  campaigns: number;
}

export function campaignBenchmark(rows: BreakdownRow[]): CampaignBenchmark {
  let spend = 0;
  let leads = 0;
  let clicks = 0;
  let impressions = 0;
  for (const row of rows) {
    spend += row.spend;
    leads += row.leads;
    clicks += row.clicks;
    impressions += row.impressions;
  }
  return {
    cpl: leads > 0 ? spend / leads : null,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : null,
    spend,
    leads,
    impressions,
    campaigns: rows.length,
  };
}

export type AlertSeverity = "critical" | "warning";

export interface CampaignAlert {
  id: string;
  campaign: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  evidence: string;
  action: string;
  cpl: number | null;
  ctr: number | null;
  spend: number;
  leads: number;
  triggers: string[];
}

export interface GuardrailSummary {
  alerts: CampaignAlert[];
  aboveCeiling: number;
  belowFloor: number;
  spendAtRisk: number;
  benchmark: CampaignBenchmark;
}

export function buildCampaignGuardrails(
  rows: BreakdownRow[],
  limit = 5,
): GuardrailSummary {
  const benchmark = campaignBenchmark(rows);
  const alerts: CampaignAlert[] = [];

  for (const row of rows) {
    const cplHigh =
      row.cpl !== null &&
      row.leads >= MIN_LEADS_FOR_CPL &&
      row.cpl > CPL_CEILING;
    const ctrLow =
      row.ctr !== null &&
      row.impressions >= MIN_IMPRESSIONS_FOR_CTR &&
      row.ctr < CTR_FLOOR;

    if (!cplHigh && !ctrLow) continue;

    const fatigue = cplHigh && ctrLow;
    const overCeiling =
      row.cpl !== null ? ((row.cpl - CPL_CEILING) / CPL_CEILING) * 100 : 0;
    const parts: string[] = [];
    if (cplHigh && row.cpl !== null) {
      parts.push(
        `CPL ${money(row.cpl)} is ${Math.round(overCeiling)}% above the ${money(CPL_CEILING)} ceiling`,
      );
    }
    if (ctrLow && row.ctr !== null) {
      parts.push(
        `CTR ${percent(row.ctr)} is below the ${percent(CTR_FLOOR, 1)} floor`,
      );
    }

    const severity: AlertSeverity =
      fatigue ||
      (row.cpl !== null && row.cpl >= CPL_CEILING * 1.33)
        ? "critical"
        : "warning";

    alerts.push({
      id: `guardrail-${row.key}`,
      campaign: row.campaign,
      severity,
      title: fatigue
        ? `Ad fatigue alert: ${row.campaign}`
        : cplHigh
          ? `CPL above the ₹${CPL_CEILING} ceiling`
          : `CTR below the ${percent(CTR_FLOOR, 1)} floor`,
      detail: `${parts.join(" and ")}.`,
      evidence: `${money(row.spend)} spend · ${fmt(row.leads)} leads · ${fmt(
        row.impressions,
      )} impressions`,
      action: fatigue
        ? "Pause the weakest ad sets or refresh the creative asset, then re-check after 3–4 days of delivery before adding budget."
        : cplHigh
          ? "Check lead quality, audience overlap and bid pressure; cap this campaign's spend or shift budget to a campaign below the ceiling."
          : "Refresh the hook or creative and test a new audience angle; hold judgement until the replacement has enough delivery.",
      cpl: row.cpl,
      ctr: row.ctr,
      spend: row.spend,
      leads: row.leads,
      triggers: [
        ...(cplHigh ? ["CPL ceiling"] : []),
        ...(ctrLow ? ["CTR floor"] : []),
      ],
    });
  }

  const rank: Record<AlertSeverity, number> = { critical: 0, warning: 1 };
  alerts.sort(
    (a, b) => rank[a.severity] - rank[b.severity] || b.spend - a.spend,
  );

  return {
    alerts: alerts.slice(0, limit),
    aboveCeiling: alerts.filter((alert) => alert.cpl !== null && alert.cpl > CPL_CEILING)
      .length,
    belowFloor: alerts.filter((alert) => alert.ctr !== null && alert.ctr < CTR_FLOOR)
      .length,
    spendAtRisk: alerts.reduce((total, alert) => total + alert.spend, 0),
    benchmark,
  };
}

export interface WinningFormula {
  id: string;
  campaign: string;
  rank: number;
  leads: number;
  spend: number;
  cpl: number;
  ctr: number | null;
  cplVsAverage: number | null;
  dailyBudget: number;
  suggestedDailyBudget: number;
  suggestion: string;
  evidence: string;
}

export function buildWinningFormulas(
  rows: BreakdownRow[],
  days: number,
  limit = 2,
): WinningFormula[] {
  const benchmark = campaignBenchmark(rows);
  const eligible = rows.filter(
    (row) => row.cpl !== null && row.leads >= WINNER_MIN_LEADS,
  );
  eligible.sort((a, b) => (a.cpl ?? Infinity) - (b.cpl ?? Infinity));

  return eligible.slice(0, limit).map((row, index) => {
    const cpl = row.cpl ?? 0;
    const dailyBudget = days > 0 ? row.spend / days : 0;
    const suggestedDailyBudget = dailyBudget * 1.2;
    const cplVsAverage =
      benchmark.cpl && benchmark.cpl > 0
        ? Math.round(((cpl - benchmark.cpl) / benchmark.cpl) * 1000) / 10
        : null;

    return {
      id: `winner-${row.key}`,
      campaign: row.campaign,
      rank: index + 1,
      leads: row.leads,
      spend: row.spend,
      cpl,
      ctr: row.ctr,
      cplVsAverage,
      dailyBudget,
      suggestedDailyBudget,
      suggestion: `Safely increase daily budget by 20% (${money(dailyBudget)} → ${money(
        suggestedDailyBudget,
      )}/day) while holding creative and audience constant. Review CPL after 3–4 days before another step.`,
      evidence: `${fmt(row.leads)} leads on ${money(row.spend)} over ${days} day${
        days === 1 ? "" : "s"
      }${row.ctr !== null ? ` · CTR ${percent(row.ctr)}` : ""}`,
    };
  });
}
