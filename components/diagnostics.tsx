"use client";

import { Download } from "lucide-react";
import { fmt, money, percent } from "@/lib/format";
import type { DailyRow, Metrics } from "@/lib/types";

const CSV_COLUMNS: Array<keyof DailyRow> = [
  "date",
  "campaign",
  "impressions",
  "reach",
  "clicks",
  "spend",
  "leads",
  "formLeads",
  "websiteLeads",
  "whatsappLeads",
  "messengerLeads",
  "messagingConnections",
];

function escapeCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export default function Diagnostics({
  current,
  rows,
  from,
  to,
}: {
  current: Metrics;
  rows: DailyRow[];
  from: string;
  to: string;
}) {
  function downloadCsv() {
    const lines = [
      CSV_COLUMNS.join(","),
      ...rows.map((row) =>
        CSV_COLUMNS.map((column) => escapeCell(row[column])).join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `meta_export_${from}_${to}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const cards = [
    { label: "Impressions", value: fmt(current.impressions) },
    { label: "Reach", value: fmt(current.reach) },
    { label: "CPM", value: money(current.cpm, 2) },
    { label: "Avg frequency", value: fmt(current.frequency, { dec: 2 }) },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="panel p-4">
            <p className="label-mono">{card.label}</p>
            <p className="tabular mt-1 font-mono text-xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-3">
          <div>
            <p className="text-xs font-semibold">Raw campaign rows</p>
            <p className="text-[10px] text-muted">
              {rows.length} rows · {from} → {to} · showing first 40
            </p>
          </div>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-[11px] font-semibold transition hover:border-accent/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Download CSV
          </button>
        </div>

        <div className="max-h-[320px] overflow-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-surface-2">
              <tr>
                {["Date", "Campaign", "Spend", "Leads", "Form", "Web", "CTR"].map(
                  (label, index) => (
                    <th
                      key={label}
                      className={`border-b border-line px-3 py-2 ${index > 1 ? "text-right" : "text-left"}`}
                    >
                      <span className="label-mono">{label}</span>
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 40).map((row, index) => (
                <tr
                  key={`${row.date}-${row.campaign}-${index}`}
                  className={index % 2 === 1 ? "bg-surface-2/40" : undefined}
                >
                  <td className="border-b border-line px-3 py-2 font-mono text-[11px]">
                    {row.date}
                  </td>
                  <td className="max-w-[260px] border-b border-line px-3 py-2">
                    <span className="block truncate" title={row.campaign}>
                      {row.campaign}
                    </span>
                  </td>
                  <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs">
                    {money(row.spend)}
                  </td>
                  <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs">
                    {fmt(row.leads)}
                  </td>
                  <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs">
                    {fmt(row.formLeads)}
                  </td>
                  <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs">
                    {fmt(row.websiteLeads)}
                  </td>
                  <td className="tabular border-b border-line px-3 py-2 text-right font-mono text-xs">
                    {percent(row.impressions > 0 ? (row.clicks / row.impressions) * 100 : null)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
