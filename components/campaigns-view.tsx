"use client";

import { useMemo, useState } from "react";
import { Layers, SlidersHorizontal } from "lucide-react";
import { aggregate, dailySeries, filterRows } from "@/lib/aggregate";
import { addDays, formatRange } from "@/lib/format";
import { normalizeRange, rangeForPreset } from "@/lib/range";
import type {
  CompareMode,
  DashboardData,
  PresetKey,
  RangeMode,
} from "@/lib/types";
import Breakdown from "./breakdown";
import DataStatus from "./data-status";
import Diagnostics from "./diagnostics";
import FiltersPanel from "./filters-panel";
import { Section, cn } from "./ui";

export default function CampaignsView({ data }: { data: DashboardData }) {
  const { campaign, ads, summary, generatedAt } = data;

  const allCampaigns = useMemo(
    () => [...new Set(campaign.map((row) => row.campaign))].sort(),
    [campaign],
  );

  const [rangeMode, setRangeMode] = useState<RangeMode>("preset");
  const [preset, setPreset] = useState<PresetKey>("Last 30 days");
  const [customFrom, setCustomFrom] = useState(addDays(summary.maxDate, -29));
  const [customTo, setCustomTo] = useState(summary.maxDate);
  const [compareMode, setCompareMode] = useState<CompareMode>("previous");
  const [cmpFrom, setCmpFrom] = useState(addDays(summary.maxDate, -59));
  const [cmpTo, setCmpTo] = useState(addDays(summary.maxDate, -30));
  const [selected, setSelected] = useState<string[]>(allCampaigns);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  function changeDiagnostics(value: boolean) {
    setShowDiagnostics(value);
    if (!value) return;
    window.setTimeout(() => {
      document
        .getElementById("diagnostics")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  const presetRange = rangeForPreset(preset, summary.maxDate);
  const activeRange = useMemo(
    () =>
      rangeMode === "preset"
        ? normalizeRange(presetRange.from, presetRange.to)
        : normalizeRange(customFrom, customTo),
    [rangeMode, presetRange.from, presetRange.to, customFrom, customTo],
  );

  const { from, to } = activeRange;
  const currentRows = useMemo(
    () => filterRows(campaign, from, to, selected),
    [campaign, from, to, selected],
  );
  const adRows = useMemo(
    () => filterRows(ads, from, to, selected),
    [ads, from, to, selected],
  );
  const current = useMemo(() => aggregate(currentRows), [currentRows]);
  const points = useMemo(() => dailySeries(currentRows), [currentRows]);
  const rangeLabel = formatRange(from, to);

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
    onShowDiagnosticsChange: changeDiagnostics,
    showDiagnosticsToggle: true,
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
            <header className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Layers className="h-4 w-4" />
                </span>
                <span className="label-mono text-fg">Campaigns &amp; Ads</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Investigate the details
              </h1>
              <p className="text-xs text-muted">
                {rangeLabel} · {selected.length} campaign
                {selected.length === 1 ? "" : "s"} ·{" "}
                {currentRows.length} campaign rows · {adRows.length} ad rows
              </p>
            </header>

            <DataStatus summary={summary} generatedAt={generatedAt} />

            <Section title="Campaigns & ads" subtitle="campaign · ad set · ad">
              <Breakdown campaignRows={currentRows} adRows={adRows} />
            </Section>

            {showDiagnostics ? (
              <div id="diagnostics" className="scroll-mt-3">
                <Section title="Diagnostics" subtitle="raw metrics and export">
                  <Diagnostics
                    current={current}
                    rows={currentRows}
                    from={from}
                    to={to}
                  />
                </Section>
              </div>
            ) : null}

            <footer className="mt-10 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-[10px] text-muted">
              <SlidersHorizontal className="h-3 w-3" />
              <span>
                All views use the same date range and campaign filters. Exports
                respect the same filters.
              </span>
              <span className="opacity-60">· {points.length} days in range</span>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
