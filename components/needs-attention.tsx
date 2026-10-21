import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { Finding, FindingSeverity } from "@/lib/findings";
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

export default function NeedsAttention({
  findings,
}: {
  findings: Finding[];
}) {
  return (
    <div className="space-y-2">
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
      <p className="px-1 text-[10px] text-muted">
        Deterministic rules on the selected period and comparison. These are
        observed associations, not causal claims.
      </p>
    </div>
  );
}
