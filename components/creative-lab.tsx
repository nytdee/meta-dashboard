"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  FlaskConical,
  ImageIcon,
  Layers,
  RefreshCcw,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmt, money, percent } from "@/lib/format";
import type {
  CreativeAnalysisFile,
  CreativeInsight,
  CreativeNarrativeFile,
  CreativeVerdict,
  TagCohort,
} from "@/lib/creative/types";
import { DeltaBadge, EmptyState, Section, cn } from "./ui";

const VERDICT_META: Record<
  CreativeVerdict,
  { label: string; icon: typeof TrendingUp; accent: string; pill: string }
> = {
  replicate: {
    label: "Replicate",
    icon: BadgeCheck,
    accent: "var(--green)",
    pill: "bg-good/10 text-good",
  },
  test: {
    label: "Controlled test",
    icon: FlaskConical,
    accent: "var(--blue)",
    pill: "bg-blue/10 text-blue",
  },
  hold: {
    label: "Hold",
    icon: Layers,
    accent: "var(--muted)",
    pill: "bg-surface-2 text-muted",
  },
  stop: {
    label: "Stop or fix",
    icon: Ban,
    accent: "var(--red)",
    pill: "bg-bad/10 text-bad",
  },
};

const DIMENSIONS: Array<{ key: TagCohort["dimension"]; label: string }> = [
  { key: "hook", label: "Hook" },
  { key: "angle", label: "Angle" },
  { key: "proof", label: "Proof" },
  { key: "offer", label: "Offer" },
  { key: "cta", label: "CTA" },
  { key: "format", label: "Format" },
];

function Sparkline({ insight }: { insight: CreativeInsight }) {
  const data = insight.daily.map((point) => ({
    label: point.date.slice(5),
    leads: point.leads,
  }));
  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis dataKey="label" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              fontSize: 11,
              color: "var(--fg)",
            }}
            labelFormatter={(value) => String(value)}
            formatter={(value: unknown) => [fmt(Number(value)), "leads"]}
          />
          <Line
            type="monotone"
            dataKey="leads"
            stroke="var(--purple)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TagChip({
  label,
  source,
  confidence,
}: {
  label: string;
  source?: string;
  confidence?: number;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted"
      title={
        source
          ? `Source: ${source}${confidence ? ` · confidence ${Math.round(confidence * 100)}%` : ""}`
          : undefined
      }
    >
      {label}
      {confidence !== undefined ? (
        <span className="font-mono text-[9px] opacity-70">
          {Math.round(confidence * 100)}%
        </span>
      ) : null}
    </span>
  );
}

function MetricRow({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label}>
          <p className="label-mono text-[9px]">{item.label}</p>
          <p className="tabular mt-0.5 font-mono text-xs font-bold">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function VerdictCard({
  insight,
  narrative,
  baselineCpl,
}: {
  insight: CreativeInsight;
  narrative?: string;
  baselineCpl: number | null;
}) {
  const meta = VERDICT_META[insight.verdict];
  const Icon = meta.icon;
  const { creative, performance, rationale, supportingCohorts } = insight;
  const hookCohort = supportingCohorts.find(
    (cohort) => cohort.dimension === "hook",
  );

  const nextTest =
    insight.verdict === "replicate"
      ? `Rebuild this ad in a second format (for example the same hook as a ${
          creative.format === "static image" ? "short video" : "static image"
        }) and keep spend constant for seven days. Watch CPL against the ${
          baselineCpl === null ? "account" : money(baselineCpl)
        } baseline and guard against frequency above 3.5x.`
      : insight.verdict === "stop"
        ? "Do not scale this. Pause the spend, verify tracking and form completion first, then re-test a single new variable before spending again."
        : "Run a controlled test with one changed variable and a fixed weekly budget. Promote it only when it beats the account baseline on cost per lead with an adequate sample.";

  return (
    <div
      className="panel relative overflow-hidden p-4"
      style={{ borderTop: `3px solid ${meta.accent}` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className="label-mono flex items-center gap-1.5"
            style={{ color: meta.accent }}
          >
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </p>
          <p className="mt-2 truncate text-sm font-semibold" title={creative.name}>
            {creative.name}
          </p>
          <p className="truncate text-[11px] text-muted" title={creative.body}>
            {creative.hookText}
          </p>
        </div>
        <div className="text-right">
          <span
            className={cn(
              "inline-block rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider",
              meta.pill,
            )}
          >
            confidence {Math.round(insight.confidence * 100)}%
          </span>
        </div>
      </div>

      <div className="mt-3">
        <MetricRow
          items={[
            { label: "Leads", value: fmt(performance.leads) },
            { label: "Spend", value: money(performance.spend) },
            { label: "CPL", value: money(performance.cpl) },
            { label: "CTR", value: percent(performance.ctr, 2) },
          ]}
        />
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
          <span>CPL vs baseline</span>
          <DeltaBadge change={performance.vsBaselineCpl} invert />
          <span>CTR vs baseline</span>
          <DeltaBadge change={performance.vsBaselineCtr} />
          <span>
            {percent(performance.leadShare, 1)} of leads on{" "}
            {percent(performance.spendShare, 1)} of spend
          </span>
        </div>
      </div>

      <div className="mt-3 border-t border-line pt-2">
        <p className="label-mono text-[9px]">Engine summary</p>
        <p className="mt-1 text-[11px] leading-relaxed text-fg">
          {insight.summary}
        </p>
      </div>

      <div className="mt-3 border-t border-line pt-2">
        <p className="label-mono text-[9px]">Why (quantitative)</p>
        <ul className="mt-1 space-y-1">
          {rationale.map((line) => (
            <li key={line} className="text-[11px] leading-relaxed text-muted">
              · {line}
            </li>
          ))}
        </ul>
        {hookCohort ? (
          <p className="mt-2 text-[11px] leading-relaxed text-fg">
            <span className="label-mono mr-1.5">Hook pattern</span>
            {hookCohort.tag} — {hookCohort.sampleStatus} sample,{" "}
            {hookCohort.vsBaselineCpl === null
              ? "no baseline comparison"
              : `${hookCohort.vsBaselineCpl > 0 ? "+" : ""}${hookCohort.vsBaselineCpl.toFixed(0)}% CPL vs baseline`}
            , {percent(hookCohort.leadShare, 1)} of account leads.
          </p>
        ) : null}
      </div>

      {narrative ? (
        <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-2.5">
          <p className="label-mono text-[9px] text-accent">AI read</p>
          <p className="mt-1 text-[11px] leading-relaxed text-fg">{narrative}</p>
        </div>
      ) : null}

      <div className="mt-3 border-t border-line pt-2">
        <p className="label-mono text-[9px]">Next test</p>
        <p className="mt-1 text-[11px] leading-relaxed text-fg">{nextTest}</p>
      </div>
    </div>
  );
}

function CreativeCard({
  insight,
  narrative,
}: {
  insight: CreativeInsight;
  narrative?: string;
}) {
  const [open, setOpen] = useState(false);
  const meta = VERDICT_META[insight.verdict];
  const { creative, performance } = insight;

  return (
    <div className="panel overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: "var(--surface-2)", color: meta.accent }}
        >
          <ImageIcon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold">{creative.name}</span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider",
                meta.pill,
              )}
            >
              {meta.label}
            </span>
          </span>
          <span className="mt-1 block truncate text-[11px] text-muted">
            {creative.hookText}
          </span>
          <span className="mt-2 flex flex-wrap gap-1">
            <TagChip label={creative.format} source={creative.source} />
            <TagChip label={creative.hookType} source={creative.source} />
            <TagChip label={creative.ctaType} source={creative.source} />
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted">
            <span>{fmt(performance.leads)} leads</span>
            <span>{money(performance.spend)} spend</span>
            <span>CPL {money(performance.cpl)}</span>
            <span>{performance.days} days</span>
            <span>{performance.ads.length} ads</span>
          </span>
        </span>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-line p-4">
          <div>
            <p className="label-mono text-[9px]">Source copy</p>
            <p className="mt-1 text-[11px] leading-relaxed text-fg">
              {creative.body}
            </p>
            <p className="mt-1 text-[11px] text-muted">{creative.headline}</p>
          </div>

          <div>
            <p className="label-mono text-[9px]">Extracted text (with source)</p>
            <ul className="mt-1 space-y-1">
              {creative.observed.length === 0 ? (
                <li className="text-[11px] text-muted">
                  No extracted text recorded for this creative.
                </li>
              ) : (
                creative.observed.map((entry) => (
                  <li
                    key={`${entry.source}-${entry.text}`}
                    className="flex items-start gap-2 text-[11px] text-fg"
                  >
                    <span className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[9px] uppercase text-muted">
                      {entry.source}
                    </span>
                    <span className="leading-relaxed">{entry.text}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <p className="label-mono text-[9px]">Tags</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {creative.messagingAngles.map((tag) => (
                <TagChip key={tag} label={tag} source={creative.source} />
              ))}
              {creative.proofTypes.map((tag) => (
                <TagChip key={tag} label={tag} source={creative.source} />
              ))}
              <TagChip label={creative.offerType} source={creative.source} />
              <TagChip
                label={creative.visualOpening}
                source={creative.source}
              />
              <TagChip label={creative.language} source={creative.source} />
            </div>
          </div>

          <div>
            <p className="label-mono text-[9px]">Media</p>
            <p className="mt-1 text-[11px] text-warn">{creative.mediaNote}</p>
          </div>

          <div>
            <p className="label-mono text-[9px]">Daily leads</p>
            <Sparkline insight={insight} />
          </div>

          <div>
            <p className="label-mono text-[9px]">Ad breakdown</p>
            <div className="mt-1 overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-[11px]">
                <thead>
                  <tr>
                    {["Ad", "Days", "Spend", "Leads", "CPL", "CTR"].map(
                      (label, index) => (
                        <th
                          key={label}
                          className={cn(
                            "border-b border-line px-2 py-1",
                            index === 0 ? "text-left" : "text-right",
                          )}
                        >
                          <span className="label-mono">{label}</span>
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {insight.adBreakdown.map((row) => (
                    <tr key={row.ad}>
                      <td className="max-w-[220px] border-b border-line px-2 py-1">
                        <span className="block truncate" title={row.ad}>
                          {row.ad}
                        </span>
                      </td>
                      <td className="tabular border-b border-line px-2 py-1 text-right font-mono">
                        {row.days}
                      </td>
                      <td className="tabular border-b border-line px-2 py-1 text-right font-mono">
                        {money(row.spend)}
                      </td>
                      <td className="tabular border-b border-line px-2 py-1 text-right font-mono">
                        {row.leads}
                      </td>
                      <td className="tabular border-b border-line px-2 py-1 text-right font-mono">
                        {money(row.cpl)}
                      </td>
                      <td className="tabular border-b border-line px-2 py-1 text-right font-mono">
                        {percent(row.ctr, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {narrative ? (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-2.5">
              <p className="label-mono text-[9px] text-accent">AI read</p>
              <p className="mt-1 text-[11px] leading-relaxed text-fg">
                {narrative}
              </p>
            </div>
          ) : null}

          <div className="border-t border-line pt-2">
            <p className="label-mono text-[9px]">Engine summary</p>
            <p className="mt-1 text-[11px] leading-relaxed text-fg">
              {insight.summary}
            </p>
          </div>

          <div className="border-t border-line pt-2">
            <p className="label-mono text-[9px]">Why (quantitative)</p>
            <ul className="mt-1 space-y-1">
              {insight.rationale.map((line) => (
                <li key={line} className="text-[11px] leading-relaxed text-muted">
                  · {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CreativeLab({
  analysis,
  narratives,
}: {
  analysis: CreativeAnalysisFile;
  narratives: CreativeNarrativeFile | null;
}) {
  const [search, setSearch] = useState("");
  const [format, setFormat] = useState("all");
  const [hook, setHook] = useState("all");
  const [angle, setAngle] = useState("all");
  const [cta, setCta] = useState("all");
  const [verdict, setVerdict] = useState("all");
  const [dimension, setDimension] =
    useState<TagCohort["dimension"]>("hook");
  const [onlySupported, setOnlySupported] = useState(false);

  const options = useMemo(() => {
    const pick = (values: string[]) => [...new Set(values)].sort();
    return {
      format: pick(analysis.creatives.map((item) => item.creative.format)),
      hook: pick(analysis.creatives.map((item) => item.creative.hookType)),
      angle: pick(
        analysis.creatives.flatMap((item) => item.creative.messagingAngles),
      ),
      cta: pick(analysis.creatives.map((item) => item.creative.ctaType)),
    };
  }, [analysis.creatives]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return analysis.creatives.filter((item) => {
      const creative = item.creative;
      if (format !== "all" && creative.format !== format) return false;
      if (hook !== "all" && creative.hookType !== hook) return false;
      if (angle !== "all" && !creative.messagingAngles.includes(angle))
        return false;
      if (cta !== "all" && creative.ctaType !== cta) return false;
      if (verdict !== "all" && item.verdict !== verdict) return false;
      if (needle) {
        const haystack = [
          creative.name,
          creative.hookText,
          creative.body,
          creative.headline,
          ...creative.messagingAngles,
          ...creative.proofTypes,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [analysis.creatives, search, format, hook, angle, cta, verdict]);

  const cohorts = useMemo(
    () =>
      analysis.cohorts.filter((cohort) => {
        if (cohort.dimension !== dimension) return false;
        if (onlySupported && cohort.sampleStatus !== "sufficient") return false;
        return true;
      }),
    [analysis.cohorts, dimension, onlySupported],
  );

  const replicate = filtered.filter((item) => item.verdict === "replicate");
  const tests = filtered.filter((item) => item.verdict === "test");
  const hold = filtered.filter((item) => item.verdict === "hold");
  const stop = filtered.filter((item) => item.verdict === "stop");

  const selectClass =
    "rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-[11px] font-medium text-fg outline-none focus:border-accent";

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1500px] px-4 py-5 lg:px-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="label-mono text-fg">Creative Intelligence</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Which creatives to repeat, and why
          </h1>
          <p className="text-xs text-muted">
            Rules-first analysis on ad-level delivery. Every number below is
            computed from the same dataset; AI only writes the qualitative read.
          </p>
        </header>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="panel p-3.5">
            <p className="label-mono text-[9px]">Account baseline CPL</p>
            <p className="tabular mt-1 font-mono text-xl font-bold">
              {money(analysis.baseline.cpl)}
            </p>
            <p className="mt-1 text-[10px] text-muted">
              {fmt(analysis.baseline.leads)} leads on{" "}
              {money(analysis.baseline.spend)} over {analysis.baseline.days}{" "}
              days
            </p>
          </div>
          <div className="panel p-3.5">
            <p className="label-mono text-[9px]">Account baseline CTR</p>
            <p className="tabular mt-1 font-mono text-xl font-bold">
              {percent(analysis.baseline.ctr, 2)}
            </p>
            <p className="mt-1 text-[10px] text-muted">
              {fmt(analysis.baseline.impressions)} impressions ·{" "}
              {analysis.baseline.ads} ads
            </p>
          </div>
          <div className="panel p-3.5">
            <p className="label-mono text-[9px]">Analysis engine</p>
            <p className="tabular mt-1 font-mono text-sm font-bold">
              {analysis.analysisVersion}
            </p>
            <p className="mt-1 text-[10px] text-muted">
              Minimum sample: {analysis.thresholds.minLeads} leads,{" "}
              {money(analysis.thresholds.minSpend)} spend,{" "}
              {fmt(analysis.thresholds.minImpressions)} impressions
            </p>
          </div>
          <div className="panel p-3.5">
            <p className="label-mono text-[9px]">AI narrative</p>
            <p className="tabular mt-1 font-mono text-sm font-bold">
              {narratives ? narratives.model : "not configured"}
            </p>
            <p className="mt-1 text-[10px] text-muted">
              {narratives
                ? "Prose only. All figures are rendered by the analysis engine."
                : "Set AI_API_KEY and run npm run creative:ai to add grounded AI notes."}
            </p>
          </div>
        </div>

        {analysis.mode === "demo" ? (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-warn">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="leading-relaxed">
              <span className="font-semibold">Demo workspace</span> — this
              analysis runs on generated sample data, not real campaign results.
            </p>
          </div>
        ) : null}

        {analysis.issues.map((issue) => (
          <div
            key={issue}
            className="mt-3 rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-warn"
          >
            {issue}
          </div>
        ))}

        <div className="panel mt-4 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search creative, hook or copy"
              className="w-full rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs outline-none focus:border-accent sm:w-64"
            />
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value)}
              className={selectClass}
            >
              <option value="all">All formats</option>
              {options.format.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={hook}
              onChange={(event) => setHook(event.target.value)}
              className={selectClass}
            >
              <option value="all">All hooks</option>
              {options.hook.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={angle}
              onChange={(event) => setAngle(event.target.value)}
              className={selectClass}
            >
              <option value="all">All angles</option>
              {options.angle.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={cta}
              onChange={(event) => setCta(event.target.value)}
              className={selectClass}
            >
              <option value="all">All CTAs</option>
              {options.cta.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={verdict}
              onChange={(event) => setVerdict(event.target.value)}
              className={selectClass}
            >
              <option value="all">All verdicts</option>
              <option value="replicate">Replicate</option>
              <option value="test">Controlled test</option>
              <option value="hold">Hold</option>
              <option value="stop">Stop or fix</option>
            </select>
            <span className="text-[10px] text-muted">
              {filtered.length} of {analysis.creatives.length} creatives
            </span>
          </div>
        </div>

        <Section
          title="Replicate these ads"
          subtitle="strongest measured candidates"
        >
          {replicate.length === 0 ? (
            <EmptyState>
              No creative clears the replicate threshold with this filter. Widen
              the filters or choose a longer date range.
            </EmptyState>
          ) : (
            <div className="grid gap-2.5 xl:grid-cols-2">
              {replicate.map((insight) => (
                <VerdictCard
                  key={insight.creative.id}
                  insight={insight}
                  narrative={narratives?.items[insight.creative.id]}
                  baselineCpl={analysis.baseline.cpl}
                />
              ))}
            </div>
          )}
        </Section>

        <Section
          title="Next controlled tests"
          subtitle="better than baseline, not yet decisive"
        >
          {tests.length === 0 ? (
            <EmptyState>No creatives in this state for the current filters.</EmptyState>
          ) : (
            <div className="grid gap-2.5 xl:grid-cols-2">
              {tests.map((insight) => (
                <VerdictCard
                  key={insight.creative.id}
                  insight={insight}
                  narrative={narratives?.items[insight.creative.id]}
                  baselineCpl={analysis.baseline.cpl}
                />
              ))}
            </div>
          )}
        </Section>

        <Section
          title="Underperformers"
          subtitle="spend without proportional results"
        >
          {stop.length === 0 ? (
            <EmptyState>No underperformers for the current filters.</EmptyState>
          ) : (
            <div className="grid gap-2.5 xl:grid-cols-2">
              {stop.map((insight) => (
                <VerdictCard
                  key={insight.creative.id}
                  insight={insight}
                  narrative={narratives?.items[insight.creative.id]}
                  baselineCpl={analysis.baseline.cpl}
                />
              ))}
            </div>
          )}
        </Section>

        {hold.length > 0 ? (
          <Section
            title="Hold"
            subtitle="inconclusive at the current sample size"
          >
            <div className="grid gap-2.5 xl:grid-cols-2">
              {hold.map((insight) => (
                <VerdictCard
                  key={insight.creative.id}
                  insight={insight}
                  narrative={narratives?.items[insight.creative.id]}
                  baselineCpl={analysis.baseline.cpl}
                />
              ))}
            </div>
          </Section>
        ) : null}

        <Section
          title="Performance by creative tag"
          subtitle="weighted cohorts, never averaged rows"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {DIMENSIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setDimension(item.key)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition",
                  dimension === item.key
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:text-fg",
                )}
              >
                {item.label}
              </button>
            ))}
            <label className="flex items-center gap-1.5 text-[10px] text-muted">
              <input
                type="checkbox"
                checked={onlySupported}
                onChange={(event) => setOnlySupported(event.target.checked)}
                className="accent-[var(--accent)]"
              />
              Only show adequately sampled cohorts
            </label>
          </div>

          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr>
                  {[
                    "Tag",
                    "Creatives",
                    "Ads",
                    "Spend",
                    "Leads",
                    "Lead share",
                    "CPL",
                    "CPL vs base",
                    "CTR",
                    "Sample",
                  ].map((label, index) => (
                    <th
                      key={label}
                      className={cn(
                        "border-b border-line px-3 py-2",
                        index === 0 ? "text-left" : "text-right",
                      )}
                    >
                      <span className="label-mono">{label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.length === 0 ? (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-xs text-muted"
                      colSpan={10}
                    >
                      No cohort data for this dimension.
                    </td>
                  </tr>
                ) : (
                  cohorts.map((cohort) => (
                    <tr
                      key={`${cohort.dimension}-${cohort.tag}`}
                      className="transition hover:bg-accent/5"
                    >
                      <td className="border-b border-line px-3 py-2">
                        <span className="block truncate font-medium">
                          {cohort.tag}
                        </span>
                      </td>
                      <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs">
                        {cohort.creatives}
                      </td>
                      <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs">
                        {cohort.ads}
                      </td>
                      <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs">
                        {money(cohort.spend)}
                      </td>
                      <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs font-bold">
                        {fmt(cohort.leads)}
                      </td>
                      <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs">
                        {percent(cohort.leadShare, 1)}
                      </td>
                      <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs">
                        {money(cohort.cpl)}
                      </td>
                      <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs">
                        <DeltaBadge change={cohort.vsBaselineCpl} invert />
                      </td>
                      <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs">
                        {percent(cohort.ctr, 2)}
                      </td>
                      <td className="border-b border-line px-3 py-2 text-right">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase",
                            cohort.sampleStatus === "sufficient"
                              ? "bg-good/10 text-good"
                              : cohort.sampleStatus === "low"
                                ? "bg-warn/10 text-warn"
                                : "bg-surface-2 text-muted",
                          )}
                        >
                          {cohort.sampleStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          title="Creative library"
          subtitle="source copy, extracted text, tags and performance"
        >
          {filtered.length === 0 ? (
            <EmptyState>
              <span className="flex items-center justify-center gap-2">
                <RefreshCcw className="h-3.5 w-3.5" />
                No creatives match the current filters.
              </span>
            </EmptyState>
          ) : (
            <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((insight) => (
                <CreativeCard
                  key={insight.creative.id}
                  insight={insight}
                  narrative={narratives?.items[insight.creative.id]}
                />
              ))}
            </div>
          )}
        </Section>

        <footer className="mt-10 border-t border-line pt-4 text-[10px] leading-relaxed text-muted">
          <p>
            Findings are observed associations on ad-level delivery data, not
            proven causes. A recommendation to repeat a creative is a
            hypothesis to test, never a budget instruction. AI notes, when
            enabled, only describe the pattern: every number in this view is
            produced by the analysis engine.
          </p>
        </footer>
      </div>
    </div>
  );
}
