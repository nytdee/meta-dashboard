"use client";

import { CalendarDays, FlaskConical, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { aggregate, dailySeries, filterRows } from "@/lib/aggregate";
import {
  addDays,
  daysBetween,
  deltaPercent,
  endOfPreviousMonth,
  formatDateTime,
  formatRange,
  formatShort,
  startOfMonth,
  startOfPreviousMonth,
} from "@/lib/format";
import type {
  CompareMode,
  DashboardData,
  PresetKey,
  RangeMode,
} from "@/lib/types";
import BestWorst from "./best-worst";
import Breakdown from "./breakdown";
import Diagnostics from "./diagnostics";
import FiltersPanel from "./filters-panel";
import Funnel from "./funnel";
import Insights from "./insights";
import LeadSources from "./lead-sources";
import PulseTable from "./pulse-table";
import ThemeToggle from "./theme-toggle";
import Trends from "./trends";
import { HealthPill, Section, cn } from "./ui";

function normalizeRange(from: string, to: string) {
  return from <= to ? { from, to } : { from: to, to: from };
}

function rangeForPreset(preset: PresetKey, maxDate: string) {
  switch (preset) {
    case "Today":
      return { from: maxDate, to: maxDate };
    case "Yesterday": {
      const day = addDays(maxDate, -1);
      return { from: day, to: day };
    }
    case "Last 7 days":
      return { from: addDays(maxDate, -6), to: maxDate };
    case "Last 14 days":
      return { from: addDays(maxDate, -13), to: maxDate };
    case "Last 30 days":
      return { from: addDays(maxDate, -29), to: maxDate };
    case "This month":
      return { from: startOfMonth(maxDate), to: maxDate };
    case "Last month":
      return {
        from: startOfPreviousMonth(maxDate),
        to: endOfPreviousMonth(maxDate),
      };
  }
}

export default function Dashboard({ data }: { data: DashboardData }) {
  const { campaign, ads, summary, generatedAt } = data;

  const allCampaigns = useMemo(
    () => [...new Set(campaign.map((row) => row.campaign))].sort(),
    [campaign],
  );

  const [rangeMode, setRangeMode] = useState<RangeMode>("preset");
  const [preset, setPreset] = useState<PresetKey>("Last 7 days");
  const [customFrom, setCustomFrom] = useState(addDays(summary.maxDate, -13));
  const [customTo, setCustomTo] = useState(summary.maxDate);
  const [compareMode, setCompareMode] = useState<CompareMode>("previous");
  const [cmpFrom, setCmpFrom] = useState(addDays(summary.maxDate, -27));
  const [cmpTo, setCmpTo] = useState(addDays(summary.maxDate, -14));
  const [selected, setSelected] = useState<string[]>(allCampaigns);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const presetRange = rangeForPreset(preset, summary.maxDate);
  const activeRange = useMemo(
    () =>
      rangeMode === "preset"
        ? normalizeRange(presetRange.from, presetRange.to)
        : normalizeRange(customFrom, customTo),
    [rangeMode, presetRange.from, presetRange.to, customFrom, customTo],
  );

  const { from, to } = activeRange;

  const comparison = useMemo(() => {
    if (compareMode === "none") return null;
    if (compareMode === "custom") return normalizeRange(cmpFrom, cmpTo);
    const length = daysBetween(from, to) + 1;
    const compareTo = addDays(from, -1);
    return {
      from: addDays(compareTo, -(length - 1)),
      to: compareTo,
    };
  }, [compareMode, cmpFrom, cmpTo, from, to]);

  const currentRows = useMemo(
    () => filterRows(campaign, from, to, selected),
    [campaign, from, to, selected],
  );
  const previousRows = useMemo(
    () =>
      comparison
        ? filterRows(campaign, comparison.from, comparison.to, selected)
        : [],
    [campaign, comparison, selected],
  );
  const adRows = useMemo(
    () => filterRows(ads, from, to, selected),
    [ads, from, to, selected],
  );

  const current = useMemo(() => aggregate(currentRows), [currentRows]);
  const previous = useMemo(
    () => (comparison ? aggregate(previousRows) : null),
    [comparison, previousRows],
  );
  const points = useMemo(() => dailySeries(currentRows), [currentRows]);

  const rangeLabel = formatRange(from, to);
  const comparisonLabel = comparison
    ? formatRange(comparison.from, comparison.to)
    : null;

  const issues: string[] = [];
  const goods: string[] = [];
  if (previous) {
    const cplChange = deltaPercent(current.cpl, previous.cpl);
    if (cplChange !== null) {
      if (cplChange > 20) {
        issues.push(
          `CPL up ${cplChange.toFixed(0)}% vs comparison — check creative fatigue`,
        );
      } else if (cplChange < -10) {
        goods.push(
          `CPL down ${Math.abs(cplChange).toFixed(0)}% — campaigns more efficient`,
        );
      }
    }
    const ctrChange = deltaPercent(current.ctr, previous.ctr);
    if (ctrChange !== null && ctrChange < -20) {
      issues.push("CTR dropped sharply — creative may be fatigued");
    }
  }
  if (current.frequency !== null && current.frequency > 3.5) {
    issues.push(
      `Avg frequency ${current.frequency.toFixed(1)}x — saturation risk`,
    );
  }

  const healthLevel: "good" | "warn" | "bad" =
    issues.length >= 2 ? "bad" : issues.length > 0 ? "warn" : "good";
  const healthMessage = issues.length
    ? issues.join(" · ")
    : goods.length
      ? `${goods.join(" · ")} · All healthy`
      : "All metrics healthy";

  const filtersProps = {
    rangeMode,
    onRangeModeChange: setRangeMode,
    preset,
    onPresetChange: setPreset,
    from,
    to,
    onFromChange: setCustomFrom,
    onToChange: setCustomTo,
    minDate: summary.minDate,
    maxDate: summary.maxDate,
    compareMode,
    onCompareModeChange: setCompareMode,
    cmpFrom,
    cmpTo,
    onCmpFromChange: setCmpFrom,
    onCmpToChange: setCmpTo,
    allCampaigns,
    campaigns: selected,
    onCampaignsChange: setSelected,
    showDiagnostics,
    onShowDiagnosticsChange: setShowDiagnostics,
    dataDays: summary.days,
    sourceFiles: summary.sourceFiles,
    source: summary.source,
    liveMaxDate: summary.liveMaxDate,
    generatedAt,
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1500px] px-4 py-5 lg:px-8">
        <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
          <aside className="lg:sticky lg:top-5 lg:self-start">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              className="panel flex w-full items-center justify-between px-4 py-3 text-left lg:hidden"
            >
              <span className="label-mono text-fg">Filters & data</span>
              <span className="text-[10px] text-muted">
                {filtersOpen ? "Hide" : `${summary.days} days`}
              </span>
            </button>
            <div
              className={cn(
                "mt-2 lg:mt-0",
                filtersOpen ? "block" : "hidden lg:block",
              )}
            >
              <FiltersPanel {...filtersProps} />
            </div>
          </aside>

          <main className="mt-5 min-w-0 lg:mt-0">
            <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Zap className="h-4 w-4" />
                  </span>
                  <span className="label-mono text-fg">Meta Ads</span>
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Leads Dashboard
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {rangeLabel}
                  </span>
                  {comparisonLabel ? <span>vs {comparisonLabel}</span> : null}
                  <span>
                    · {selected.length} campaign
                    {selected.length === 1 ? "" : "s"}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <HealthPill level={healthLevel} message={healthMessage} />
                <ThemeToggle />
              </div>
            </header>

            <div className="mt-4 h-0.5 rounded bg-gradient-to-r from-accent via-good to-warn" />

            {summary.source === "sample" ? (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-warn">
                <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="leading-relaxed">
                  <span className="font-semibold">Sample data</span> — the live
                  export
                  {summary.liveMaxDate
                    ? ` ends ${formatShort(summary.liveMaxDate)}`
                    : " is unavailable"}
                  . Showing {summary.days} days of generated demo data through{" "}
                  {formatShort(summary.maxDate)}. Refresh the CSV export and run{" "}
                  <code className="font-mono">npm run data</code> to restore live
                  figures.
                </p>
              </div>
            ) : null}

            {selected.length === 0 ? (
              <div className="mt-4 rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-warn">
                No campaigns selected. Pick at least one campaign in Filters.
              </div>
            ) : null}

            <Section title="Performance funnel" subtitle={rangeLabel}>
              <Funnel current={current} previous={previous} />
            </Section>

            <Section title="Lead landing type" subtitle="exact source per lead">
              <LeadSources current={current} />
            </Section>

            <Section title="Daily pulse" subtitle="latest complete windows">
              <PulseTable
                rows={campaign}
                campaigns={selected}
                maxDate={summary.maxDate}
              />
            </Section>

            <Section title="Trends" subtitle={rangeLabel}>
              <Trends points={points} />
            </Section>

            <Section title="Breakdown" subtitle="campaign · ad set · ad">
              <Breakdown campaignRows={currentRows} adRows={adRows} />
            </Section>

            <Section title="Best & worst ads" subtitle={rangeLabel}>
              <BestWorst adRows={adRows} />
            </Section>

            <Section title="Insights">
              <Insights current={current} previous={previous} />
            </Section>

            {showDiagnostics ? (
              <Section title="Diagnostics" subtitle="raw metrics and export">
                <Diagnostics
                  current={current}
                  rows={currentRows}
                  from={from}
                  to={to}
                />
              </Section>
            ) : null}

            <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-[10px] text-muted">
              <span>
                {summary.source === "sample" ? "Sample data" : "Data"} through{" "}
                {formatShort(summary.maxDate)} · generated{" "}
                {formatDateTime(generatedAt)}
              </span>
              <span>
                {summary.source === "sample"
                  ? summary.liveMaxDate
                    ? `Live CSV ends ${formatShort(summary.liveMaxDate)}`
                    : "No live CSV files"
                  : `${summary.sourceFiles} source files`}{" "}
                · Next.js
              </span>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
