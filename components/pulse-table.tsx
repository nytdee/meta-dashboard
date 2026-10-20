"use client";

import { useMemo } from "react";
import { aggregate, filterRows } from "@/lib/aggregate";
import {
  addDays,
  deltaPercent,
  endOfPreviousMonth,
  fmt,
  money,
  percent,
  startOfMonth,
  startOfPreviousMonth,
} from "@/lib/format";
import type { DailyRow } from "@/lib/types";
import { DeltaBadge, EmptyState, cn } from "./ui";

type MetricKey = "reach" | "impressions" | "clicks" | "ctr" | "spend" | "cpl" | "leads";

const METRICS: Array<{
  key: MetricKey;
  label: string;
  accent: string;
  invert?: boolean;
  format: (value: number | null) => string;
}> = [
  { key: "reach", label: "Reach", accent: "var(--violet)", format: (v) => fmt(v) },
  { key: "impressions", label: "Impr.", accent: "var(--blue)", format: (v) => fmt(v) },
  { key: "clicks", label: "Clicks", accent: "var(--purple)", format: (v) => fmt(v) },
  { key: "ctr", label: "CTR", accent: "var(--yellow)", format: (v) => percent(v) },
  { key: "spend", label: "Spend", accent: "var(--green)", format: (v) => money(v) },
  { key: "cpl", label: "CPL", accent: "var(--yellow)", invert: true, format: (v) => money(v) },
  { key: "leads", label: "Leads", accent: "var(--purple)", format: (v) => fmt(v) },
];

const PAIRS: Record<number, number> = { 0: 1, 2: 3, 4: 5 };

export default function PulseTable({
  rows,
  campaigns,
  maxDate,
}: {
  rows: DailyRow[];
  campaigns: string[];
  maxDate: string;
}) {
  const windows = useMemo(() => {
    const lastWeekEnd = addDays(maxDate, -7);
    const lastMonthEnd = endOfPreviousMonth(maxDate);
    return [
      { label: "Today", from: maxDate, to: maxDate },
      { label: "Yesterday", from: addDays(maxDate, -1), to: addDays(maxDate, -1) },
      { label: "This week", from: addDays(maxDate, -6), to: maxDate },
      { label: "Last week", from: addDays(maxDate, -13), to: lastWeekEnd },
      { label: "This month", from: startOfMonth(maxDate), to: maxDate },
      { label: "Last month", from: startOfPreviousMonth(maxDate), to: lastMonthEnd },
    ].map((window) => ({
      ...window,
      metrics: aggregate(filterRows(rows, window.from, window.to, campaigns)),
    }));
  }, [rows, campaigns, maxDate]);

  if (campaigns.length === 0) {
    return <EmptyState>Select at least one campaign to see the daily pulse.</EmptyState>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 border-b border-line bg-surface-2 px-3 py-2.5 text-left">
                <span className="label-mono">Metric</span>
              </th>
              {windows.map((window, index) => (
                <th
                  key={window.label}
                  className={cn(
                    "border-b border-line px-3 py-2.5 text-right",
                    index === 0 && "bg-accent/5",
                  )}
                >
                  <span
                    className={cn(
                      "label-mono flex items-center justify-end gap-1.5",
                      index === 0 && "text-accent",
                    )}
                  >
                    {index === 0 ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    ) : null}
                    {window.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric, rowIndex) => (
              <tr key={metric.key} className={rowIndex % 2 === 1 ? "bg-surface-2/50" : undefined}>
                <td
                  className={cn(
                    "sticky left-0 z-10 border-b border-line px-3 py-2.5",
                    rowIndex % 2 === 1 ? "bg-surface-2" : "bg-surface",
                  )}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    <span
                      className="inline-block h-3.5 w-0.5 rounded"
                      style={{ backgroundColor: metric.accent }}
                    />
                    {metric.label}
                  </span>
                </td>
                {windows.map((window, index) => {
                  const value = window.metrics[metric.key];
                  const pairIndex = PAIRS[index];
                  const previousValue =
                    pairIndex !== undefined
                      ? windows[pairIndex].metrics[metric.key]
                      : null;
                  return (
                    <td
                      key={`${window.label}-${metric.key}`}
                      className={cn(
                        "tabular border-b border-line px-3 py-2.5 text-right font-mono text-xs font-bold",
                        index === 0 ? "bg-accent/5 text-accent" : "text-fg",
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {metric.format(value)}
                        {pairIndex !== undefined ? (
                          <DeltaBadge
                            change={deltaPercent(value, previousValue)}
                            invert={metric.invert}
                          />
                        ) : null}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-line px-3 py-2 text-[10px] text-muted">
        Week and month columns compare against the previous week and month.
      </div>
    </div>
  );
}
