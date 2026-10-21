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
      <p className="px-1 text-[10px] leading-relaxed text-muted">
        Ranked by lead volume, not revenue or qualified leads. Low-volume ads
        are provisional and should not be treated as proven winners.
      </p>
      <div className="grid gap-2.5 md:grid-cols-2">
        {best ? (
          <AdCard
            row={best}
            badge="Most leads"
            accent="var(--green)"
            why={`CPL ${money(best.cpl)} · CTR ${percent(best.ctr)} · ${best.leads.toLocaleString("en-US")} leads${best.leads < 5 ? " · low sample" : ""}`}
          />
        ) : (
          <EmptyState>No ads with leads in this period.</EmptyState>
        )}
        {worst ? (
          <AdCard
            row={worst}
            badge={
              worst.leads === 0
                ? "Spend with no leads"
                : "Highest spend per lead"
            }
            accent="var(--red)"
            why={
              worst.leads === 0
                ? `${money(worst.spend)} spend · no tracked leads · check tracking and form completion before judging the creative`
                : `${money(worst.spend)} spend · CPL ${money(worst.cpl)} · ${worst.leads.toLocaleString("en-US")} leads${worst.leads < 5 ? " · low sample" : ""}`
            }
          />
        ) : null}
      </div>
    </div>
  );
}
