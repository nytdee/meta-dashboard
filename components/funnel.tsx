import type { LucideIcon } from "lucide-react";
import {
  Eye,
  MousePointerClick,
  Percent,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { deltaPercent, fmt, money, percent } from "@/lib/format";
import type { Metrics } from "@/lib/types";
import { DeltaBadge } from "./ui";

type FunnelCard = {
  label: string;
  value: string;
  sub: string;
  change: number | null;
  invert?: boolean;
  accent: string;
  icon: LucideIcon;
};

function previousSub(
  current: number | null,
  previous: number | null,
  formatted: string,
  fallback: string,
): string {
  if (previous !== null && previous !== 0 && current !== null) {
    return `vs ${formatted}`;
  }
  return fallback;
}

export default function Funnel({
  current,
  previous,
}: {
  current: Metrics;
  previous: Metrics | null;
}) {
  const cards: FunnelCard[] = [
    {
      label: "Leads",
      value: fmt(current.leads),
      sub: previousSub(current.leads, previous?.leads ?? null, fmt(previous?.leads), "total leads"),
      change: deltaPercent(current.leads, previous?.leads),
      accent: "var(--purple)",
      icon: Target,
    },
    {
      label: "CPL",
      value: money(current.cpl),
      sub: previousSub(current.cpl, previous?.cpl ?? null, money(previous?.cpl), "cost per lead"),
      change: deltaPercent(current.cpl, previous?.cpl),
      invert: true,
      accent: "var(--yellow)",
      icon: TrendingUp,
    },
    {
      label: "Spend",
      value: money(current.spend),
      sub: previousSub(current.spend, previous?.spend ?? null, money(previous?.spend), "total budget"),
      change: deltaPercent(current.spend, previous?.spend),
      accent: "var(--green)",
      icon: Wallet,
    },
    {
      label: "CTR",
      value: percent(current.ctr),
      sub: previousSub(current.ctr, previous?.ctr ?? null, percent(previous?.ctr), "click-through rate"),
      change: deltaPercent(current.ctr, previous?.ctr),
      accent: "var(--yellow)",
      icon: Percent,
    },
    {
      label: "Clicks",
      value: fmt(current.clicks),
      sub: previousSub(current.clicks, previous?.clicks ?? null, fmt(previous?.clicks), "link clicks"),
      change: deltaPercent(current.clicks, previous?.clicks),
      accent: "var(--blue)",
      icon: MousePointerClick,
    },
    {
      label: "Impressions",
      value: fmt(current.impressions),
      sub: previousSub(
        current.impressions,
        previous?.impressions ?? null,
        fmt(previous?.impressions),
        "total ad views",
      ),
      change: deltaPercent(current.impressions, previous?.impressions),
      accent: "var(--violet)",
      icon: Eye,
    },
    {
      label: "Acc. Reach",
      value: fmt(current.reach),
      sub: previousSub(current.reach, previous?.reach ?? null, fmt(previous?.reach), "unique people"),
      change: deltaPercent(current.reach, previous?.reach),
      accent: "var(--purple)",
      icon: Users,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 xl:grid-cols-7">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="panel relative overflow-hidden p-3.5"
          >
            <div
              className="absolute inset-x-0 top-0 h-0.5"
              style={{ backgroundColor: card.accent }}
            />
            <div className="flex items-start justify-between">
              <Icon className="h-4 w-4" style={{ color: card.accent }} />
              <span className="font-mono text-[9px] text-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <p className="label-mono mt-3">{card.label}</p>
            <p className="tabular mt-1 font-mono text-xl font-bold leading-none">
              {card.value}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted">
              <span className="truncate">{card.sub}</span>
              <DeltaBadge change={card.change} invert={card.invert} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
