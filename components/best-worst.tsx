"use client";

import { Flame, Star } from "lucide-react";
import { useMemo } from "react";
import { breakdown, quantile } from "@/lib/aggregate";
import { money, percent } from "@/lib/format";
import type { BreakdownRow, DailyRow } from "@/lib/types";
import { EmptyState } from "./ui";

function AdCard({
  row,
  badge,
  accent,
  why,
}: {
  row: BreakdownRow;
  badge: string;
  accent: string;
  why: string;
}) {
  const Icon = accent === "var(--green)" ? Star : Flame;
  return (
    <div
      className="panel relative overflow-hidden p-4"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <p
        className="label-mono flex items-center gap-1.5"
        style={{ color: accent }}
      >
        <Icon className="h-3.5 w-3.5" />
        {badge}
      </p>
      <p className="mt-2 truncate text-sm font-semibold" title={row.ad}>
        {row.ad}
      </p>
      <p className="truncate text-[11px] text-muted" title={row.campaign}>
        {row.campaign}
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {[
          { label: "Leads", value: row.leads.toLocaleString("en-US") },
          { label: "CPL", value: money(row.cpl) },
          { label: "CTR", value: percent(row.ctr) },
          { label: "Spend", value: money(row.spend) },
        ].map((metric) => (
          <div key={metric.label}>
            <p className="label-mono text-[9px]">{metric.label}</p>
            <p className="tabular mt-0.5 truncate font-mono text-xs font-bold">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 border-t border-line pt-2 text-[11px] text-muted">{why}</p>
    </div>
  );
}

export default function BestWorst({ adRows }: { adRows: DailyRow[] }) {
  const ranked = useMemo(() => breakdown(adRows, "ad"), [adRows]);

  const best = useMemo(() => {
    const candidates = ranked.filter((row) => row.leads > 0);
    return (
      [...candidates].sort(
        (a, b) =>
          b.leads - a.leads ||
          (a.cpl ?? Number.POSITIVE_INFINITY) - (b.cpl ?? Number.POSITIVE_INFINITY),
      )[0] ?? null
    );
  }, [ranked]);

  const worst = useMemo(() => {
    if (ranked.length === 0) return null;
    const threshold = quantile(ranked.map((row) => row.spend), 0.25);
    const pool = ranked.filter((row) => row.spend > threshold);
    const source = pool.length > 0 ? pool : ranked;
    return [...source].sort(
      (a, b) => b.spend / (b.leads + 0.1) - a.spend / (a.leads + 0.1),
    )[0];
  }, [ranked]);

  if (!best && !worst) {
    return (
      <EmptyState>
        No ad-level data for the selected period. Run{" "}
        <code className="text-fg">python daily_fetch.py --backfill</code> to fetch it.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2.5 md:grid-cols-2">
        {best ? (
          <AdCard
            row={best}
            badge="Best performing ad"
            accent="var(--green)"
            why={`CPL ${money(best.cpl)} · CTR ${percent(best.ctr)} · ${best.leads.toLocaleString("en-US")} leads`}
          />
        ) : (
          <EmptyState>No ads with leads in this period.</EmptyState>
        )}
        {worst ? (
          <AdCard
            row={worst}
            badge="Bleeding money"
            accent="var(--red)"
            why={`${money(worst.spend)} spend · ${worst.leads.toLocaleString("en-US")} leads · waste score ${(worst.spend / (worst.leads + 0.1)).toFixed(0)}`}
          />
        ) : null}
      </div>

      <details className="panel group overflow-hidden">
        <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold text-muted transition hover:text-fg">
          All ads ranked
          <span className="ml-2 text-[10px] font-normal">
            ({ranked.length} ads)
          </span>
        </summary>
        <div className="max-h-[420px] overflow-auto border-t border-line">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-surface-2">
              <tr>
                {["Ad", "Campaign", "Leads", "Spend", "CTR", "CPL"].map((label, index) => (
                  <th
                    key={label}
                    className={`border-b border-line px-3 py-2 ${index > 1 ? "text-right" : "text-left"}`}
                  >
                    <span className="label-mono">{label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranked.map((row, index) => (
                <tr
                  key={row.key}
                  className={index % 2 === 1 ? "bg-surface-2/40" : undefined}
                >
                  <td className="max-w-[240px] border-b border-line px-3 py-2">
                    <span className="block truncate font-medium" title={row.ad}>
                      {row.ad}
                    </span>
                  </td>
                  <td className="max-w-[220px] border-b border-line px-3 py-2">
                    <span className="block truncate text-xs text-muted" title={row.campaign}>
                      {row.campaign}
                    </span>
                  </td>
                  <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs font-bold">
                    {row.leads.toLocaleString("en-US")}
                  </td>
                  <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs">
                    {money(row.spend)}
                  </td>
                  <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs">
                    {percent(row.ctr)}
                  </td>
                  <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs">
                    {money(row.cpl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
