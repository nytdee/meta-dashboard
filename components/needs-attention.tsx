import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Flame,
  ShieldAlert,
} from "lucide-react";
import type { Finding, FindingSeverity } from "@/lib/findings";
import { money, percent } from "@/lib/format";
import {
  CPL_CEILING,
  CTR_FLOOR,
  type CampaignAlert,
  type GuardrailSummary,
} from "@/lib/guardrails";
import { cn } from "./ui";

const styles: Record<
  FindingSeverity,
  { accent: string; icon: typeof AlertTriangle; label: string; pill: string }
> = {
  critical: {
    accent: "var(--red)",
    icon: AlertOctagon,
    label: "Critical",
    pill: "bg-bad/10 text-bad",
  },
  warning: {
    accent: "var(--yellow)",
    icon: AlertTriangle,
    label: "Warning",
    pill: "bg-warn/10 text-warn",
  },
  positive: {
    accent: "var(--green)",
    icon: CheckCircle2,
    label: "Positive",
    pill: "bg-good/10 text-good",
  },
};

function GuardrailCard({ alert }: { alert: CampaignAlert }) {
  const critical = alert.severity === "critical";
  const Icon = critical ? Flame : AlertTriangle;
  const accent = critical ? "var(--red)" : "var(--yellow)";

  return (
    <div className="panel border-l-2 p-4" style={{ borderLeftColor: accent }}>
      <div className="flex items-start gap-3">
        <Icon
          className="mt-0.5 h-4 w-4 shrink-0"
          style={{ color: accent }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{alert.campaign}</p>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider",
                critical ? "bg-bad/10 text-bad" : "bg-warn/10 text-warn",
              )}
            >
              {critical ? "Critical" : "Warning"}
            </span>
            {alert.triggers.map((trigger) => (
              <span
                key={trigger}
                className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] text-muted"
              >
                {trigger}
              </span>
            ))}
          </div>
          <p className="mt-1 text-xs font-medium">{alert.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {alert.detail}
          </p>
          <p className="mt-2 text-[10px] text-muted">
            <span className="label-mono mr-1.5">Evidence</span>
            {alert.evidence}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-fg">
            <span className="label-mono mr-1.5">Action</span>
            {alert.action}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NeedsAttention({
  findings,
  guardrails = null,
}: {
  findings: Finding[];
  guardrails?: GuardrailSummary | null;
}) {
  return (
    <div className="space-y-3">
      {guardrails ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-xs font-semibold">Budget guardrails</p>
            <p className="text-[10px] text-muted">
              Ceiling {money(CPL_CEILING)} CPL · floor{" "}
              {percent(CTR_FLOOR, 1)} CTR ·{" "}
              {guardrails.alerts.length === 0
                ? "no campaign flagged"
                : `${guardrails.alerts.length} flagged · ${money(
                    guardrails.spendAtRisk,
                  )} under watch`}
            </p>
          </div>
          {guardrails.alerts.length === 0 ? (
            <div className="panel flex items-start gap-3 border-l-2 p-4" style={{ borderLeftColor: "var(--green)" }}>
              <ShieldAlert
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: "var(--green)" }}
              />
              <p className="text-xs leading-relaxed text-muted">
                No campaign is above the {money(CPL_CEILING)} CPL ceiling or
                below the {percent(CTR_FLOOR, 1)} CTR floor in this filter.
              </p>
            </div>
          ) : (
            guardrails.alerts.map((alert) => (
              <GuardrailCard key={alert.id} alert={alert} />
            ))
          )}
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="px-1 text-xs font-semibold">Period-level findings</p>
        {findings.map((finding) => {
          const style = styles[finding.severity];
          const Icon = style.icon;
          return (
            <div
              key={finding.id}
              className="panel border-l-2 p-4"
              style={{ borderLeftColor: style.accent }}
            >
              <div className="flex items-start gap-3">
                <Icon
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: style.accent }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{finding.title}</p>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider",
                        style.pill,
                      )}
                    >
                      {style.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {finding.detail}
                  </p>
                  <p className="mt-2 text-[10px] text-muted">
                    <span className="label-mono mr-1.5">Evidence</span>
                    {finding.evidence}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-fg">
                    <span className="label-mono mr-1.5">Next step</span>
                    {finding.action}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="px-1 text-[10px] text-muted">
        Deterministic rules on the selected period, filter and comparison.
        Guardrails use campaign-level totals; these are observed associations,
        not causal claims.
      </p>
    </div>
  );
}
