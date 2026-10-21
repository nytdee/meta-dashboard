import { ClipboardList, MessageCircle, Smartphone, Globe } from "lucide-react";
import { money } from "@/lib/format";
import type { Metrics } from "@/lib/types";

export default function LeadSources({ current }: { current: Metrics }) {
  const sources = [
    {
      icon: ClipboardList,
      name: "Instant Form",
      value: current.formLeads,
      accent: "var(--purple)",
      actionType: "onsite_conversion.lead_grouped",
    },
    {
      icon: Globe,
      name: "Website Pixel",
      value: current.websiteLeads,
      accent: "var(--green)",
      actionType: "onsite_web_lead",
    },
    {
      icon: Smartphone,
      name: "WhatsApp Click",
      value: current.whatsappLeads,
      accent: "var(--pink)",
      actionType: "onsite_conversion.messaging_whatsapp_reply",
    },
  ];

  const total = sources.reduce((sum, source) => sum + source.value, 0);

  return (
    <div className="grid gap-2.5 md:grid-cols-3">
      {sources.map((source) => {
        const Icon = source.icon;
        const share = total > 0 ? (source.value / total) * 100 : 0;
        const cpl = source.value > 0 ? current.spend / source.value : null;
        return (
          <div
            key={source.name}
            className="panel relative overflow-hidden p-4"
          >
            <div
              className="absolute inset-x-0 top-0 h-0.5"
              style={{ backgroundColor: source.accent }}
            />
            <div className="flex items-start justify-between gap-2">
              <div>
                <Icon className="h-4 w-4" style={{ color: source.accent }} />
                <p className="label-mono mt-2">{source.name}</p>
              </div>
              <div className="text-right">
                <p
                  className="font-mono text-xs font-bold"
                  style={{ color: source.accent }}
                >
                  {share.toFixed(1)}%
                </p>
                <p className="text-[10px] text-muted">of tracked</p>
              </div>
            </div>
            <p className="tabular mt-2 font-mono text-2xl font-bold">
              {source.value.toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              {money(cpl)} blended CPL · {source.actionType}
            </p>
            <div className="mt-3 h-1 overflow-hidden rounded bg-line">
              <div
                className="h-1 rounded"
                style={{
                  width: `${Math.max(share, source.value > 0 ? 2 : 0)}%`,
                  backgroundColor: source.accent,
                }}
              />
            </div>
          </div>
        );
      })}

      <div className="panel flex items-center gap-3 p-4 md:col-span-3">
        <MessageCircle className="h-4 w-4 text-blue" />
        <p className="text-[11px] text-muted">
          <span className="font-semibold text-fg">
            {current.messengerLeads.toLocaleString("en-US")} Messenger
          </span>{" "}
          conversations and{" "}
          <span className="font-semibold text-fg">
            {current.messagingConnections.toLocaleString("en-US")}
          </span>{" "}
          total messaging connections were recorded in this period. They are not
          counted inside lead totals, which only include form and website leads.
        </p>
      </div>
    </div>
  );
}
