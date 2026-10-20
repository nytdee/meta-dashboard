"use client";

import { CalendarRange, Database, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import MultiSelect from "./multi-select";
import { cn } from "./ui";
import { formatDateTime, formatShort } from "@/lib/format";
import type {
  CompareMode,
  PresetKey,
  RangeMode,
} from "@/lib/types";
import { PRESETS } from "@/lib/types";

type FiltersPanelProps = {
  rangeMode: RangeMode;
  onRangeModeChange: (value: RangeMode) => void;
  preset: PresetKey;
  onPresetChange: (value: PresetKey) => void;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  minDate: string;
  maxDate: string;
  compareMode: CompareMode;
  onCompareModeChange: (value: CompareMode) => void;
  cmpFrom: string;
  cmpTo: string;
  onCmpFromChange: (value: string) => void;
  onCmpToChange: (value: string) => void;
  allCampaigns: string[];
  campaigns: string[];
  onCampaignsChange: (value: string[]) => void;
  showDiagnostics: boolean;
  onShowDiagnosticsChange: (value: boolean) => void;
  dataDays: number;
  sourceFiles: number;
  source: "live" | "sample";
  liveMaxDate: string | null;
  generatedAt: string;
};

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div
      className="grid gap-1 rounded-lg bg-surface-2 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-2 py-1.5 text-[11px] font-semibold transition",
            value === option.value
              ? "bg-surface text-fg shadow-sm"
              : "text-muted hover:text-fg",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-3">
      <span className="label-mono mb-1.5 block">{label}</span>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none transition focus:border-accent";

export default function FiltersPanel({
  rangeMode,
  onRangeModeChange,
  preset,
  onPresetChange,
  from,
  to,
  onFromChange,
  onToChange,
  minDate,
  maxDate,
  compareMode,
  onCompareModeChange,
  cmpFrom,
  cmpTo,
  onCmpFromChange,
  onCmpToChange,
  allCampaigns,
  campaigns,
  onCampaignsChange,
  showDiagnostics,
  onShowDiagnosticsChange,
  dataDays,
  sourceFiles,
  source,
  liveMaxDate,
  generatedAt,
}: FiltersPanelProps) {
  return (
    <div className="panel p-4">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="h-3.5 w-3.5 text-accent" />
        <span className="label-mono text-fg">Filters</span>
      </div>

      <span className="label-mono mb-1.5 block">Date mode</span>
      <Segmented
        value={rangeMode}
        options={[
          { value: "preset", label: "Preset" },
          { value: "custom", label: "Custom" },
        ]}
        onChange={onRangeModeChange}
      />

      {rangeMode === "preset" ? (
        <Field label="Range">
          <select
            value={preset}
            onChange={(event) => onPresetChange(event.target.value as PresetKey)}
            className={inputClass}
          >
            {PRESETS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <span className="label-mono mb-1.5 block">From</span>
            <input
              type="date"
              value={from}
              min={minDate}
              max={maxDate}
              onChange={(event) => onFromChange(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <span className="label-mono mb-1.5 block">To</span>
            <input
              type="date"
              value={to}
              min={minDate}
              max={maxDate}
              onChange={(event) => onToChange(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center gap-2">
        <CalendarRange className="h-3.5 w-3.5 text-accent" />
        <span className="label-mono text-fg">Compare to</span>
      </div>
      <div className="mt-2">
        <Segmented
          value={compareMode}
          options={[
            { value: "previous", label: "Previous" },
            { value: "custom", label: "Custom" },
            { value: "none", label: "None" },
          ]}
          onChange={onCompareModeChange}
        />
      </div>

      {compareMode === "custom" ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <span className="label-mono mb-1.5 block">From</span>
            <input
              type="date"
              value={cmpFrom}
              min={minDate}
              max={maxDate}
              onChange={(event) => onCmpFromChange(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <span className="label-mono mb-1.5 block">To</span>
            <input
              type="date"
              value={cmpTo}
              min={minDate}
              max={maxDate}
              onChange={(event) => onCmpToChange(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        <MultiSelect
          label="Campaigns"
          options={allCampaigns}
          value={campaigns}
          onChange={onCampaignsChange}
        />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2">
        <div>
          <span className="text-xs font-medium">Diagnostics</span>
          <p className="text-[10px] text-muted">Reach, CPM and raw export</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={showDiagnostics}
          onClick={() => onShowDiagnosticsChange(!showDiagnostics)}
          className={cn(
            "relative h-5 w-9 shrink-0 rounded-full border transition",
            showDiagnostics
              ? "border-accent bg-accent"
              : "border-line bg-surface",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition",
              showDiagnostics ? "left-[18px]" : "left-0.5 bg-muted",
            )}
          />
        </button>
      </div>

      <div className="mt-4 space-y-1 border-t border-line pt-3 text-[10px] leading-relaxed text-muted">
        {source === "sample" ? (
          <>
            <p className="flex items-center gap-1.5 text-warn">
              <Database className="h-3 w-3" />
              Sample dataset · {dataDays} days
            </p>
            <p>
              {liveMaxDate
                ? `Live CSV ends ${formatShort(liveMaxDate)}`
                : "No live CSV files"}
            </p>
          </>
        ) : (
          <>
            <p className="flex items-center gap-1.5">
              <Database className="h-3 w-3" />
              {dataDays} days on disk · {sourceFiles} files
            </p>
            <p>Data through {formatShort(maxDate)}</p>
          </>
        )}
        <p>Generated {formatDateTime(generatedAt)}</p>
      </div>
    </div>
  );
}
