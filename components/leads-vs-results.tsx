import { CheckCircle2, ClipboardList, Percent, TrendingDown } from "lucide-react";
import { fmt } from "@/lib/format";
import type { Metrics } from "@/lib/types";

export default function LeadsVsResults({ current }: { current: Metrics }) {
  const leads = current.leads;
  const messaging = current.messagingConnections;
  const totalResults = Math.round(leads + Math.max(messaging - leads, 0));
  const dropOff = Math.max(totalResults - leads, 0);
  const conversionRate = totalResults > 0 ? (leads / totalResults) * 100 : 0;

  const cards = [
    {
      icon: CheckCircle2,
      label: "Total Leads",
      value: fmt(leads),
      sub: "form fills counted by Meta",
      accent: "var(--green)",
    },
    {
      icon: ClipboardList,
      label: "Total Results",
      value: fmt(totalResults),
      sub: "all conversions Meta optimised for",
      accent: "var(--purple)",
    },
    {
      icon: TrendingDown,
      label: "Drop-off",
      value: fmt(dropOff),
      sub: "started but didn't complete",
      accent: "var(--red)",
    },
    {
      icon: Percent,
      label: "Lead Conv. Rate",
      value: `${conversionRate.toFixed(1)}%`,
      sub: "results that became leads",
      accent: "var(--yellow)",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="panel p-4"
              style={{ borderLeft: `3px solid ${card.accent}` }}
            >
              <Icon className="h-4 w-4" style={{ color: card.accent }} />
              <p className="label-mono mt-2">{card.label}</p>
              <p className="tabular mt-1 font-mono text-xl font-bold">
                {card.value}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">{card.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="panel border-l-2 border-l-accent p-4">
        <p className="label-mono text-accent">How Meta identifies leads</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            {
              title: "Instant Form",
              copy: "User taps ad → fills Meta's native form → submit",
              color: "var(--green)",
            },
            {
              title: "Website Pixel",
              copy: "User clicks → lands on your page → pixel fires on submit",
              color: "var(--yellow)",
            },
            {
              title: "WhatsApp Click",
              copy: "User taps → opens WhatsApp → first message sent",
              color: "var(--pink)",
            },
            {
              title: "Messenger",
              copy: `${fmt(current.messengerLeads)} conversations started · tracked separately from leads`,
              color: "var(--blue)",
            },
            {
              title: "Attribution window",
              copy: "Default: 7-day click + 1-day view",
              color: "var(--violet)",
            },
          ].map((item) => (
            <div key={item.title}>
              <p
                className="text-xs font-bold"
                style={{ color: item.color }}
              >
                {item.title}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                {item.copy}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
