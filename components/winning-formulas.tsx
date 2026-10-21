"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Rocket, Trophy } from "lucide-react";
import { breakdown } from "@/lib/aggregate";
import { addDays, fmt, money, percent } from "@/lib/format";
import { buildWinningFormulas, campaignBenchmark } from "@/lib/guardrails";
import type { DailyRow } from "@/lib/types";
import { cn } from "./ui";

const RANGES = [
  { key: 7, label: "Last 7 days" },
  { key: 30, label: "Last 30 days" },
  { key: 90, label: "Last 90 days" },
  { key: 0, label: "All sample data" },
] as const;

export default function WinningFormulas({
  rows,
  defaultDays = 30,
}: {
  rows: DailyRow[];
  defaultDays?: number;
}) {
  const [days, setDays] = useState<number>(defaultDays);

  const maxDate = useMemo(
    () => rows.reduce((latest, row) => (row.date > latest ? row.date : latest), ""),
    [rows],
  );
  const from = days > 0 && maxDate ? addDays(maxDate, -(days - 1)) : "";

  const scoped = useMemo(
    () => (from ? rows.filter((row) => row.date >= from) : rows),
    [rows, from],
  );
  const actualDays = useMemo(
    () =>
      days > 0
        ? days
        : new Set(scoped.map((row) => row.date)).size,
    [days, scoped],
  );

  const campaignRows = useMemo(
    () => breakdown(scoped, "campaign"),
    [scoped],
  );
  const benchmark = useMemo(
    () => campaignBenchmark(campaignRows),
    [campaignRows],
  );
  const winners = useMemo(
    () => buildWinningFormulas(campaignRows, actualDays),
    [campaignRows, actualDays],
  );

  if (rows.length === 0) return null;

  return (
    <section className="panel mt-4 overflow-hidden border-accent/25 bg-gradient-to-br from-accent/[0.08] via-surface to-surface">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Trophy className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Winning formulas</h2>
            <p className="mt-0.5 text-[11px] text-muted">
              Lowest CPL campaigns with enough volume to trust · account
              benchmark {money(benchmark.cpl)} CPL
            </p>
          </div>
        </div>
        <select
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          className="rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-[11px] font-medium text-fg outline-none focus:border-accent"
          aria-label="Winning formula range"
        >
          {RANGES.map((range) => (
            <option key={range.key} value={range.key}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      {winners.length === 0 ? (
        <p className="px-4 py-5 text-sm text-muted">
          No campaign has at least 20 leads in this range yet. Widen the range
          before scaling.
        </p>
      ) : (
        <div className="grid gap-2.5 p-3 md:grid-cols-2">
          {winners.map((winner) => (
            <div key={winner.id} className="panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-accent">
                    #{winner.rank} formula
                  </span>
                  {winner.cplVsAverage !== null ? (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-[9px] font-bold",
                        winner.cplVsAverage <= 0
                          ? "bg-good/10 text-good"
                          : "bg-warn/10 text-warn",
                      )}
                    >
                      {winner.cplVsAverage > 0 ? "+" : ""}
                      {winner.cplVsAverage.toFixed(0)}% vs avg
                    </span>
                  ) : null}
                </div>
                <Rocket className="h-4 w-4 text-accent" />
              </div>

              <p className="mt-2 truncate text-sm font-semibold" title={winner.campaign}>
                {winner.campaign}
              </p>

              <div className="mt-3 grid grid-cols-4 gap-2">
                <div>
                  <p className="label-mono text-[9px]">CPL</p>
                  <p className="tabular mt-0.5 font-mono text-sm font-bold text-good">
                    {money(winner.cpl)}
                  </p>
                </div>
                <div>
                  <p className="label-mono text-[9px]">Leads</p>
                  <p className="tabular mt-0.5 font-mono text-sm font-bold">
                    {fmt(winner.leads)}
                  </p>
                </div>
                <div>
                  <p className="label-mono text-[9px]">CTR</p>
                  <p className="tabular mt-0.5 font-mono text-sm font-bold">
                    {percent(winner.ctr)}
                  </p>
                </div>
                <div>
                  <p className="label-mono text-[9px]">Spend</p>
                  <p className="tabular mt-0.5 font-mono text-sm font-bold">
                    {money(winner.spend)}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-fg">
                {winner.suggestion}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] text-muted">{winner.evidence}</p>
                <Link
                  href="/campaigns"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:opacity-80"
                >
                  Verify in table <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="border-t border-line px-4 py-2 text-[10px] leading-relaxed text-muted">
        Budget suggestions are arithmetic (+20% daily budget at the observed
        CPL), not guarantees. Volume, creative and audience are held constant;
        re-check CPL after 3–4 days.
      </p>
    </section>
  );
}
