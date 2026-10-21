"use client";

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmt, money, percent } from "@/lib/format";
import type { DailyPoint } from "@/lib/types";

type MetricKey =
  | "leads"
  | "spend"
  | "cpl"
  | "ctr"
  | "clicks"
  | "impressions"
  | "reach";

const METRICS: Array<{
  key: MetricKey;
  label: string;
  color: string;
  format: (value: number | null) => string;
}> = [
  { key: "leads", label: "Leads", color: "var(--purple)", format: (v) => fmt(v) },
  { key: "cpl", label: "CPL", color: "var(--yellow)", format: (v) => money(v) },
  { key: "spend", label: "Spend", color: "var(--green)", format: (v) => money(v) },
  { key: "ctr", label: "CTR", color: "var(--blue)", format: (v) => percent(v) },
  { key: "clicks", label: "Clicks", color: "var(--pink)", format: (v) => fmt(v) },
  {
    key: "impressions",
    label: "Impressions",
    color: "var(--violet)",
    format: (v) => fmt(v),
  },
  {
    key: "reach",
    label: "Summed reach",
    color: "var(--violet)",
    format: (v) => fmt(v),
  },
];

const axisTick = { fill: "var(--muted)", fontSize: 10 };
const gridStroke = "var(--line)";

function compact(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export default function TrendChart({
  current,
  previous,
  comparisonLabel,
}: {
  current: DailyPoint[];
  previous: DailyPoint[];
  comparisonLabel: string | null;
}) {
  const [metricKey, setMetricKey] = useState<MetricKey>("leads");
  const metric = METRICS.find((item) => item.key === metricKey) ?? METRICS[0];

  const series = useMemo(() => {
    const length = Math.max(current.length, previous.length);
    return Array.from({ length }, (_, index) => ({
      label: current[index]?.label ?? previous[index]?.label ?? "",
      current: current[index]?.[metricKey] ?? null,
      previous: previous[index]?.[metricKey] ?? null,
    }));
  }, [current, previous, metricKey]);

  if (current.length === 0) {
    return (
      <div className="panel px-4 py-6 text-center text-sm text-muted">
        No trend data for this period.
      </div>
    );
  }

  const hasComparison = previous.length > 0;
  const comparisonName = comparisonLabel ?? "Comparison";

  function axisFormatter(value: number): string {
    if (metricKey === "cpl" || metricKey === "spend") {
      return `₹${compact(value)}`;
    }
    if (metricKey === "ctr") return `${compact(value)}%`;
    return compact(value);
  }

  return (
    <div className="panel p-3.5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: metric.color }}
          />
          <span className="label-mono">Daily {metric.label.toLowerCase()}</span>
        </div>
        <label className="flex items-center gap-2 text-[10px] text-muted">
          Metric
          <select
            value={metricKey}
            onChange={(event) => setMetricKey(event.target.value as MetricKey)}
            className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-[11px] font-medium text-fg outline-none focus:border-accent"
          >
            {METRICS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={series}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={metric.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={metric.color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={gridStroke}
            />
            <XAxis
              dataKey="label"
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={54}
              tickFormatter={axisFormatter}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--fg)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              }}
              labelStyle={{ color: "var(--muted)" }}
              formatter={(value: unknown, name: unknown) => [
                value === null || value === undefined
                  ? "—"
                  : metric.format(Number(value)),
                name === "previous" ? comparisonName : metric.label,
              ]}
              cursor={{ stroke: "var(--line)" }}
            />
            <Area
              type="monotone"
              dataKey="current"
              stroke={metric.color}
              strokeWidth={2}
              fill="url(#trendFill)"
              connectNulls
            />
            {hasComparison ? (
              <Line
                type="monotone"
                dataKey="previous"
                stroke="var(--muted)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[10px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-1.5 w-4 rounded-full"
            style={{ backgroundColor: metric.color }}
          />
          {metric.label}
        </span>
        {hasComparison ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-px w-4 border-t border-dashed border-muted" />
            {comparisonName}
          </span>
        ) : null}
        {hasComparison && previous.length !== current.length ? (
          <span>Comparison aligned by day index for a different-length period.</span>
        ) : null}
      </div>
    </div>
  );
}
