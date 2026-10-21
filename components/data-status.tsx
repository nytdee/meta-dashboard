import {
  AlertTriangle,
  Database,
  FlaskConical,
} from "lucide-react";
import { formatDateTime, formatShort } from "@/lib/format";
import type { DashboardData } from "@/lib/types";
import { cn } from "./ui";

export default function DataStatus({
  summary,
  generatedAt,
}: {
  summary: DashboardData["summary"];
  generatedAt: string;
}) {
  const demo = summary.source === "sample";
  const Icon = demo ? FlaskConical : summary.stale ? AlertTriangle : Database;
  const label = demo
    ? "Demo data"
    : summary.stale
      ? "Stale live data"
      : "Live data";

  return (
    <div
      className={cn(
        "mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-3 py-2 text-[11px]",
        demo
          ? "border-warn/30 bg-warn/10 text-warn"
          : summary.stale
            ? "border-bad/30 bg-bad/10 text-bad"
            : "border-line bg-surface text-muted",
      )}
    >
      <span className="inline-flex items-center gap-1.5 font-semibold">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span>Data through {formatShort(summary.maxDate)}</span>
      {demo ? (
        <span>
          {summary.liveMaxDate
            ? `Live CSV ends ${formatShort(summary.liveMaxDate)}`
            : "No live CSV files"}
          {" · "}
          generated demo, not real results
        </span>
      ) : summary.stale ? (
        <span>
          Newest CSV is {summary.staleDays} day
          {summary.staleDays === 1 ? "" : "s"} old · refresh the export and run{" "}
          <code className="font-mono">npm run data</code>
        </span>
      ) : null}
      {!demo && summary.missingDates.length > 0 ? (
        <span>
          {summary.missingDates.length} date
          {summary.missingDates.length === 1 ? "" : "s"} missing from source
          coverage
        </span>
      ) : null}
      <span className="text-muted">
        Generated {formatDateTime(generatedAt)}
      </span>
    </div>
  );
}
