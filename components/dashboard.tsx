"use client";

import Link from "next/link";
import { CalendarDays, Layers, Sparkles, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { aggregate, dailySeries, filterRows } from "@/lib/aggregate";
import { buildFindings } from "@/lib/findings";
import { addDays, daysBetween, formatRange } from "@/lib/format";
import type { CreativeAnalysisFile } from "@/lib/creative/types";
import { normalizeRange, rangeForPreset } from "@/lib/range";
import type {
  CompareMode,
  DashboardData,
  PresetKey,
  RangeMode,
} from "@/lib/types";
import DataStatus from "./data-status";
import FiltersPanel from "./filters-panel";
import Funnel from "./funnel";
import LeadSources from "./lead-sources";
import MetricDefinitions from "./metric-definitions";
import NeedsAttention from "./needs-attention";
import ThemeToggle from "./theme-toggle";
import TrendChart from "./trend-chart";
import { Section, cn } from "./ui";

export type TopCreative = {
  id: string;
  name: string;
  campaign: string;
  leads: number;
  spend: number;
  cpl: number | null;
  vsBaselineCpl: number | null;
  verdict: string;
};

export default function Dashboard({
  data,
  analysis = null,
}: {
  data: DashboardData;
  analysis?: CreativeAnalysisFile | null;
}) {
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
  const previousPoints = useMemo(
    () => (comparison ? dailySeries(previousRows) : []),
    [comparison, previousRows],
  );

  const rangeLabel = formatRange(from, to);
  const comparisonLabel = comparison
    ? formatRange(comparison.from, comparison.to)
    : null;

  const findings = useMemo(
    () =>
      buildFindings({
        current,
        previous,
        rangeLabel,
        comparisonLabel,
      }),
    [current, previous, rangeLabel, comparisonLabel],
  );

  // Creative performance is computed on ad-level delivery rows and rescoped to
  // the selected range so it never mixes periods.
  const topCreatives = useMemo<TopCreative[]>(() => {
    if (!analysis) return [];
    const totals = { leads: 0, spend: 0, clicks: 0, impressions: 0 };
    const scoped = analysis.creatives.map((item) => {
      let leads = 0;
      let spend = 0;
      let clicks = 0;
      let impressions = 0;
      for (const point of item.daily) {
        if (point.date < from || point.date > to) continue;
        leads += point.leads;
        spend += point.spend;
        clicks += point.clicks;
        impressions += point.impressions;
      }
      totals.leads += leads;
      totals.spend += spend;
      totals.clicks += clicks;
      totals.impressions += impressions;
      return { item, leads, spend, clicks, impressions };
    });
    const baselineCpl =
      totals.leads > 0 ? totals.spend / totals.leads : null;
    return scoped
      .filter((entry) => entry.leads > 0)
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 3)
      .map((entry) => {
        const cpl = entry.leads > 0 ? entry.spend / entry.leads : null;
        return {
          id: entry.item.creative.id,
          name: entry.item.creative.name,
          campaign: entry.item.performance.campaigns.join(", "),
          leads: entry.leads,
          spend: Math.round(entry.spend * 100) / 100,
          cpl,
          vsBaselineCpl:
            cpl !== null && baselineCpl
              ? Math.round(((cpl - baselineCpl) / baselineCpl) * 10000) / 100
              : null,
          verdict: entry.item.verdict,
        };
      });
  }, [analysis, from, to]);

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
    showDiagnostics: false,
    onShowDiagnosticsChange: () => {},
    showDiagnosticsToggle: false,
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
                  Meta Ads Intelligence
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
                <ThemeToggle />
              </div>
            </header>

            <div className="mt-4 h-0.5 rounded bg-gradient-to-r from-accent via-good to-warn" />

            <DataStatus summary={summary} generatedAt={generatedAt} />

            {selected.length === 0 ? (
              <div className="mt-4 rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-warn">
                No campaigns selected. Pick at least one campaign in Filters.
              </div>
            ) : null}

            <Section
              title="Primary KPIs"
              subtitle={`${rangeLabel} · Default objective: Meta-reported leads, not qualified`}
            >
              <Funnel current={current} previous={previous} />
            </Section>

            <Section title="Needs attention" subtitle="rule-based, evidence-linked">
              <NeedsAttention findings={findings} />
            </Section>

            <Section title="Lead landing type" subtitle="exact source per lead">
              <LeadSources current={current} />
            </Section>

            <Section title="Performance trend" subtitle={rangeLabel}>
              <TrendChart
                current={points}
                previous={previousPoints}
                comparisonLabel={comparisonLabel}
              />
            </Section>

            <Section
              title="Top performers"
              subtitle="ad-level delivery in the selected range"
            >
              {topCreatives.length === 0 ? (
                <div className="panel px-4 py-5 text-sm text-muted">
                  No creative analysis is available yet. Run{" "}
                  <code className="font-mono text-fg">npm run creative:analyze</code>.
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="px-1 text-[10px] leading-relaxed text-muted">
                    The business objective is not configured yet, so this ranks
                    by reported lead volume on ad-level delivery. It is not a
                    profit ranking and not a causal claim.
                  </p>
                  <div className="grid gap-2.5 md:grid-cols-3">
                    {topCreatives.map((creative) => (
                      <div key={creative.id} className="panel p-4">
                        <p className="truncate text-sm font-semibold">
                          {creative.name}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-muted">
                          {creative.campaign}
                        </p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div>
                            <p className="label-mono text-[9px]">Leads</p>
                            <p className="tabular mt-0.5 font-mono text-xs font-bold">
                              {creative.leads.toLocaleString("en-US")}
                            </p>
                          </div>
                          <div>
                            <p className="label-mono text-[9px]">CPL</p>
                            <p className="tabular mt-0.5 font-mono text-xs font-bold">
                              ₹{Math.round(creative.cpl ?? 0).toLocaleString("en-US")}
                            </p>
                          </div>
                          <div>
                            <p className="label-mono text-[9px]">Vs base</p>
                            <p className="tabular mt-0.5 font-mono text-xs font-bold">
                              {creative.vsBaselineCpl === null
                                ? "—"
                                : `${creative.vsBaselineCpl > 0 ? "+" : ""}${creative.vsBaselineCpl.toFixed(0)}%`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/creative"
                    className="inline-flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent/20"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Open Creative Intelligence for goal-aware rankings, tag
                    cohorts and replicate candidates
                  </Link>
                </div>
              )}
            </Section>

            <div className="mt-8 grid gap-2.5 md:grid-cols-2">
              <Link
                href="/creative"
                className="panel flex items-center gap-3 p-4 transition hover:border-accent/40"
              >
                <Sparkles className="h-4 w-4 text-accent" />
                <span>
                  <span className="block text-sm font-semibold">
                    Creative Intelligence
                  </span>
                  <span className="block text-[11px] text-muted">
                    Which ads to replicate and why, with quantitative evidence
                  </span>
                </span>
              </Link>
              <Link
                href="/campaigns"
                className="panel flex items-center gap-3 p-4 transition hover:border-accent/40"
              >
                <Layers className="h-4 w-4 text-accent" />
                <span>
                  <span className="block text-sm font-semibold">
                    Campaigns &amp; Ads
                  </span>
                  <span className="block text-[11px] text-muted">
                    Drill-down table, exports and collapsed diagnostics
                  </span>
                </span>
              </Link>
            </div>

            <MetricDefinitions />
          </main>
        </div>
      </div>
    </div>
  );
}
