"use client";

import { ArrowDown, ArrowUp, Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { breakdown } from "@/lib/aggregate";
import { fmt, money, percent } from "@/lib/format";
import {
  campaignBenchmark,
  CPL_BAD_RATIO,
  CPL_WARN_RATIO,
  CTR_BAD_RATIO,
  CTR_WARN_RATIO,
} from "@/lib/guardrails";
import type { BreakdownLevel, DailyRow } from "@/lib/types";
import { EmptyState, cn } from "./ui";

type SortKey = "leads" | "spend" | "ctr" | "cpl";

type Tone = "good" | "warn" | "bad" | "none";

const CELL_TONE: Record<Tone, string> = {
  good: "bg-good/10 text-good",
  warn: "bg-warn/10 text-warn",
  bad: "bg-bad/10 text-bad",
  none: "",
};

const MIN_LEADS_FOR_CPL = 3;
const MIN_IMPRESSIONS_FOR_CTR = 1_000;

function ratioTone(
  value: number | null,
  benchmark: number | null,
  sample: number,
  minSample: number,
  betterWhenLower: boolean,
): Tone {
  if (
    value === null ||
    benchmark === null ||
    benchmark <= 0 ||
    sample < minSample
  ) {
    return "none";
  }
  const ratio = value / benchmark;
  if (betterWhenLower) {
    if (ratio >= CPL_BAD_RATIO) return "bad";
    if (ratio >= CPL_WARN_RATIO) return "warn";
    if (ratio <= 0.85) return "good";
    return "none";
  }
  if (ratio <= CTR_BAD_RATIO) return "bad";
  if (ratio <= CTR_WARN_RATIO) return "warn";
  if (ratio >= 1.15) return "good";
  return "none";
}

const TABS: Array<{ level: BreakdownLevel; label: string }> = [
  { level: "campaign", label: "Campaign" },
  { level: "adset", label: "Ad set" },
  { level: "ad", label: "Ad" },
];

const SORTABLE: Array<{ key: SortKey; label: string }> = [
  { key: "leads", label: "Leads" },
  { key: "spend", label: "Spend" },
  { key: "ctr", label: "CTR" },
  { key: "cpl", label: "CPL" },
];

export default function Breakdown({
  campaignRows,
  adRows,
}: {
  campaignRows: DailyRow[];
  adRows: DailyRow[];
}) {
  const [level, setLevel] = useState<BreakdownLevel>("campaign");
  const [sortKey, setSortKey] = useState<SortKey>("leads");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () => breakdown(level === "campaign" ? campaignRows : adRows, level),
    [level, campaignRows, adRows],
  );

  const benchmark = useMemo(() => campaignBenchmark(rows), [rows]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? rows.filter((row) =>
          `${row.campaign} ${row.adset} ${row.ad}`
            .toLowerCase()
            .includes(needle),
        )
      : rows;

    return [...filtered].sort((a, b) => {
      if (sortKey === "leads" || sortKey === "spend") {
        return sortDir === "asc" ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey];
      }
      const left = a[sortKey];
      const right = b[sortKey];
      if (left === null && right === null) return 0;
      if (left === null) return 1;
      if (right === null) return -1;
      return sortDir === "asc" ? left - right : right - left;
    });
  }, [rows, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "cpl" ? "asc" : "desc");
    }
  }

  function changeLevel(next: BreakdownLevel) {
    setLevel(next);
    setSortKey("leads");
    setSortDir("desc");
    setQuery("");
  }

  function downloadCsv() {
    const header =
      level === "campaign"
        ? ["campaign", "reach", "leads", "spend", "ctr", "cpl"]
        : [
            "campaign",
            level === "adset" ? "adset" : "ad",
            "reach",
            "leads",
            "spend",
            "ctr",
            "cpl",
          ];
    const lines = [
      header.join(","),
      ...visible.map((row) =>
        [
          row.campaign,
          ...(level === "campaign"
            ? []
            : [level === "adset" ? row.adset : row.ad]),
          row.reach,
          row.leads,
          row.spend,
          row.ctr ?? "",
          row.cpl ?? "",
        ]
          .map((value) => {
            const text = String(value);
            return /[",\n]/.test(text)
              ? `"${text.replace(/"/g, '""')}"`
              : text;
          })
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `meta_${level}_export.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const nameHeader = level === "campaign" ? "Campaign" : level === "adset" ? "Ad set" : "Ad";

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-3">
        <div className="flex gap-1 rounded-lg bg-surface-2 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.level}
              type="button"
              onClick={() => changeLevel(tab.level)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[11px] font-semibold transition",
                level === tab.level
                  ? "bg-surface text-fg shadow-sm"
                  : "text-muted hover:text-fg",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2">
            <Search className="h-3 w-3 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="w-32 bg-transparent py-1.5 text-xs outline-none placeholder:text-muted"
            />
          </div>
          <span className="text-[10px] text-muted">{visible.length} rows</span>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={visible.length === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-[10px] font-semibold transition hover:border-accent/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-3 w-3" />
            Export
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="p-4">
          <EmptyState>No {level} data for the selected period and campaigns.</EmptyState>
        </div>
      ) : (
        <div className="max-h-[540px] overflow-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-surface-2">
              <tr>
                <th className="border-b border-line px-3 py-2 text-left">
                  <span className="label-mono">{nameHeader}</span>
                </th>
                {level !== "campaign" ? (
                  <th className="border-b border-line px-3 py-2 text-left">
                    <span className="label-mono">Campaign</span>
                  </th>
                ) : null}
                <th className="border-b border-line px-3 py-2 text-right">
                  <span className="label-mono">Reach</span>
                </th>
                {SORTABLE.map((column) => (
                  <th
                    key={column.key}
                    className="border-b border-line px-3 py-2 text-right"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="ml-auto flex items-center gap-1 hover:text-fg"
                    >
                      <span
                        className={cn(
                          "label-mono",
                          sortKey === column.key && "text-accent",
                        )}
                      >
                        {column.label}
                      </span>
                      {sortKey === column.key ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-accent" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-accent" />
                        )
                      ) : null}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row, index) => {
                const cplTone = ratioTone(
                  row.cpl,
                  benchmark.cpl,
                  row.leads,
                  MIN_LEADS_FOR_CPL,
                  true,
                );
                const ctrTone = ratioTone(
                  row.ctr,
                  benchmark.ctr,
                  row.impressions,
                  MIN_IMPRESSIONS_FOR_CTR,
                  false,
                );
                return (
                  <tr
                    key={row.key}
                    className={cn(
                      "transition hover:bg-accent/5",
                      index % 2 === 1 && "bg-surface-2/40",
                      cplTone === "warn" && "bg-warn/[0.04]",
                      cplTone === "bad" && "bg-bad/[0.06] hover:bg-bad/[0.09]",
                    )}
                  >
                    <td className="max-w-[280px] border-b border-line px-3 py-2">
                      <span
                        className="block truncate font-medium"
                        title={level === "campaign" ? row.campaign : level === "adset" ? row.adset : row.ad}
                      >
                        {level === "campaign" ? row.campaign : level === "adset" ? row.adset : row.ad}
                      </span>
                    </td>
                    {level !== "campaign" ? (
                      <td className="max-w-[220px] border-b border-line px-3 py-2">
                        <span className="block truncate text-xs text-muted" title={row.campaign}>
                          {row.campaign}
                        </span>
                      </td>
                    ) : null}
                    <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs">
                      {fmt(row.reach)}
                    </td>
                    <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs font-bold">
                      {fmt(row.leads)}
                    </td>
                    <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs">
                      {money(row.spend)}
                    </td>
                    <td
                      className={cn(
                        "tabular border-b border-line px-3 py-2 text-right font-mono text-xs",
                        CELL_TONE[ctrTone],
                        ctrTone !== "none" && "font-semibold",
                      )}
                      title={
                        benchmark.ctr !== null && row.ctr !== null
                          ? `${percent(row.ctr)} CTR · benchmark ${percent(benchmark.ctr)}`
                          : undefined
                      }
                    >
                      {percent(row.ctr)}
                    </td>
                    <td
                      className={cn(
                        "tabular border-b border-line px-3 py-2 text-right font-mono text-xs",
                        CELL_TONE[cplTone],
                        cplTone !== "none" && "font-semibold",
                      )}
                      title={
                        benchmark.cpl !== null && row.cpl !== null
                          ? `${money(row.cpl)} CPL · benchmark ${money(benchmark.cpl)}`
                          : undefined
                      }
                    >
                      {money(row.cpl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line px-3 py-2 text-[10px] text-muted">
        <span className="font-mono">
          Benchmark: CPL {money(benchmark.cpl)} · CTR {percent(benchmark.ctr)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-good/60" /> efficient
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-warn/60" /> watch
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-bad/60" /> inefficient
        </span>
        <span className="ml-auto hidden sm:inline">
          Weighted from the current filter. Cells under 3 leads or 1,000
          impressions stay neutral.
        </span>
      </div>
    </div>
  );
}
