import { deltaPercent, fmt, money, percent } from "./format";
import type { Metrics } from "./types";

export type FindingSeverity = "critical" | "warning" | "positive";

export type Finding = {
  id: string;
  severity: FindingSeverity;
  title: string;
  detail: string;
  evidence: string;
  action: string;
};

const MIN_SPEND = 1000;
const MIN_LEADS = 5;
const MIN_IMPRESSIONS = 10_000;
const CPL_WARNING = 20;
const CPL_CRITICAL = 50;
const CPL_IMPROVEMENT = -15;
const CTR_WARNING = -20;
const FREQUENCY_WARNING = 3.5;

export function buildFindings({
  current,
  previous,
  rangeLabel,
  comparisonLabel,
}: {
  current: Metrics;
  previous: Metrics | null;
  rangeLabel: string;
  comparisonLabel: string | null;
}): Finding[] {
  const findings: Finding[] = [];
  const compare = comparisonLabel ? ` vs ${comparisonLabel}` : "";
  const evidenceRange = comparisonLabel
    ? `${rangeLabel}${compare}`
    : rangeLabel;

  if (current.leads === 0 && current.spend >= MIN_SPEND) {
    findings.push({
      id: "spend-no-leads",
      severity: "critical",
      title: "Spend recorded with no leads",
      detail: `${money(current.spend)} was spent with zero reported leads in this period.`,
      evidence: evidenceRange,
      action:
        "Check tracking, form completion, and the campaigns receiving the most spend before adding budget.",
    });
  }

  const cplChange = deltaPercent(current.cpl, previous?.cpl);
  if (
    cplChange !== null &&
    previous &&
    current.leads >= MIN_LEADS &&
    previous.leads >= MIN_LEADS
  ) {
    if (cplChange > CPL_WARNING) {
      findings.push({
        id: "cpl-up",
        severity: cplChange > CPL_CRITICAL ? "critical" : "warning",
        title: `CPL is up ${cplChange.toFixed(0)}%`,
        detail: `Cost per lead moved from ${money(previous.cpl)} to ${money(current.cpl)}.`,
        evidence: `${evidenceRange} · ${fmt(current.leads)} leads and ${fmt(previous.leads)} comparison leads`,
        action:
          "Compare ads with rising spend and flat leads; review creative fatigue and audience overlap before scaling.",
      });
    } else if (cplChange < CPL_IMPROVEMENT) {
      findings.push({
        id: "cpl-down",
        severity: "positive",
        title: `CPL is down ${Math.abs(cplChange).toFixed(0)}%`,
        detail: `Cost per lead improved from ${money(previous.cpl)} to ${money(current.cpl)}.`,
        evidence: `${evidenceRange} · ${fmt(current.leads)} leads and ${fmt(previous.leads)} comparison leads`,
        action:
          "Identify the ads contributing most of the efficient volume, then test a controlled scale-up.",
      });
    }
  }

  const ctrChange = deltaPercent(current.ctr, previous?.ctr);
  if (
    ctrChange !== null &&
    ctrChange < CTR_WARNING &&
    current.impressions >= MIN_IMPRESSIONS
  ) {
    findings.push({
      id: "ctr-down",
      severity: "warning",
      title: `CTR is down ${Math.abs(ctrChange).toFixed(0)}%`,
      detail: `Click-through rate moved from ${percent(previous?.ctr)} to ${percent(current.ctr)}.`,
      evidence: `${evidenceRange} · ${fmt(current.impressions)} impressions`,
      action:
        "Test new opening hooks or refresh the lowest-CTR creatives; avoid judging this until the new creative has enough delivery.",
    });
  }

  if (
    current.frequency !== null &&
    current.frequency > FREQUENCY_WARNING &&
    current.impressions >= MIN_IMPRESSIONS
  ) {
    findings.push({
      id: "frequency-high",
      severity: "warning",
      title: `Average frequency is ${current.frequency.toFixed(1)}x`,
      detail:
        "The same audience is being reached repeatedly, which can signal saturation.",
      evidence: `${evidenceRange} · ${fmt(current.impressions)} impressions and ${fmt(current.reach)} summed reach`,
      action:
        "Review audience size and creative rotation; consider a new audience or a fresh creative angle.",
    });
  }

  if (findings.length === 0) {
    findings.push({
      id: "no-issues",
      severity: "positive",
      title: "No material performance issues detected",
      detail:
        "CPL, CTR, frequency, and spend-with-no-leads checks did not trigger for this period.",
      evidence: evidenceRange,
      action:
        "Keep monitoring the same metrics and add a business outcome source before treating leads as revenue.",
    });
  }

  const rank: Record<FindingSeverity, number> = {
    critical: 0,
    warning: 1,
    positive: 2,
  };
  return findings.sort((a, b) => rank[a.severity] - rank[b.severity]).slice(0, 4);
}
