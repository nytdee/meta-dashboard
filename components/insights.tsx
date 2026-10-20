import {
  CheckCircle2,
  Eye,
  Repeat2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { deltaPercent } from "@/lib/format";
import type { Metrics } from "@/lib/types";

export default function Insights({
  current,
  previous,
}: {
  current: Metrics;
  previous: Metrics | null;
}) {
  const items: Array<{
    icon: typeof Eye;
    color: string;
    text: string;
  }> = [];

  const cplChange = deltaPercent(current.cpl, previous?.cpl);
  if (cplChange !== null) {
    if (cplChange > 20) {
      items.push({
        icon: TrendingUp,
        color: "var(--red)",
        text: `CPL up ${cplChange.toFixed(0)}% vs comparison period. Check creative fatigue before scaling.`,
      });
    } else if (cplChange < -15) {
      items.push({
        icon: TrendingDown,
        color: "var(--green)",
        text: `CPL down ${Math.abs(cplChange).toFixed(0)}% vs comparison. Campaigns are improving — good time to scale.`,
      });
    }
  }

  const ctrChange = deltaPercent(current.ctr, previous?.ctr);
  if (ctrChange !== null && ctrChange < -20) {
    items.push({
      icon: Eye,
      color: "var(--yellow)",
      text: `CTR dropped ${Math.abs(ctrChange).toFixed(0)}%. Refresh creatives on the lowest-CTR campaigns.`,
    });
  }

  if (current.frequency !== null && current.frequency > 3.5) {
    items.push({
      icon: Repeat2,
      color: "var(--red)",
      text: `Average frequency ${current.frequency.toFixed(1)}x — audience too small or creatives need refreshing.`,
    });
  }

  if (items.length === 0) {
    items.push({
      icon: CheckCircle2,
      color: "var(--green)",
      text: "No issues detected. All metrics are healthy for this period.",
    });
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={`${item.text}-${index}`}
            className="panel flex items-start gap-3 border-l-2 p-3.5"
            style={{ borderLeftColor: item.color }}
          >
            <Icon
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: item.color }}
            />
            <p className="text-xs leading-relaxed text-fg">{item.text}</p>
          </div>
        );
      })}
    </div>
  );
}
