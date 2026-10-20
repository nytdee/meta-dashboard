"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmt, money, percent } from "@/lib/format";
import type { DailyPoint } from "@/lib/types";

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--fg)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
};

function ChartCard({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <div className="panel p-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
        <span className="label-mono">{title}</span>
      </div>
      <div className="h-[170px] w-full">{children}</div>
    </div>
  );
}

const axisTick = { fill: "var(--muted)", fontSize: 10 };
const gridStroke = "var(--line)";

export default function Trends({ points }: { points: DailyPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="panel px-4 py-6 text-center text-sm text-muted">
        No trend data for this period.
      </div>
    );
  }

  return (
    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
      <ChartCard title="Leads" accent="var(--purple)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
            <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={18} />
            <YAxis hide />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "var(--glow)" }}
              formatter={(value: unknown) => fmt(Number(value))}
            />
            <Bar dataKey="leads" fill="var(--purple)" radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="CPL" accent="var(--yellow)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
            <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={18} />
            <YAxis hide />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: unknown) => money(Number(value))}
            />
            <Line type="monotone" dataKey="cpl" stroke="var(--yellow)" strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="CTR" accent="var(--green)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
            <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={18} />
            <YAxis hide />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: unknown) => percent(Number(value))}
            />
            <Line type="monotone" dataKey="ctr" stroke="var(--green)" strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Acc. Reach" accent="var(--violet)">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="reachFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--violet)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--violet)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
            <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={18} />
            <YAxis hide />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: unknown) => fmt(Number(value))}
            />
            <Area type="monotone" dataKey="reach" stroke="var(--violet)" strokeWidth={2} fill="url(#reachFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
