import fs from "node:fs";
import path from "node:path";
import CreativeLab from "@/components/creative-lab";
import dashboard from "@/public/data/dashboard.json";
import type { DailyRow } from "@/lib/types";
import type {
  CreativeAnalysisFile,
  CreativeNarrativeFile,
} from "@/lib/creative/types";

export const dynamic = "force-static";

function campaignRows(): DailyRow[] {
  const rows = dashboard.campaign as unknown as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    date: String(row.date ?? ""),
    campaign: String(row.campaign ?? ""),
    adset: "",
    ad: "",
    impressions: Number(row.impressions ?? 0),
    reach: Number(row.reach ?? 0),
    clicks: Number(row.clicks ?? 0),
    spend: Number(row.spend ?? 0),
    leads: Number(row.leads ?? 0),
    formLeads: 0,
    websiteLeads: 0,
    whatsappLeads: 0,
    messengerLeads: 0,
    messagingConnections: 0,
    frequency: 0,
  }));
}

function readAnalysis(): CreativeAnalysisFile | null {
  try {
    const file = path.join(
      process.cwd(),
      "public",
      "data",
      "creative-analysis.json",
    );
    return JSON.parse(fs.readFileSync(file, "utf8")) as CreativeAnalysisFile;
  } catch {
    return null;
  }
}

function readNarratives(): CreativeNarrativeFile | null {
  try {
    const file = path.join(
      process.cwd(),
      "public",
      "data",
      "creative-narratives.json",
    );
    return JSON.parse(fs.readFileSync(file, "utf8")) as CreativeNarrativeFile;
  } catch {
    return null;
  }
}

export default function CreativePage() {
  const analysis = readAnalysis();
  const narratives = readNarratives();

  if (!analysis) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Creative analysis is not built</h1>
        <p className="mt-2 text-sm text-muted">
          Run <code className="font-mono text-fg">npm run creative:analyze</code>{" "}
          to generate the creative performance analysis, then rebuild.
        </p>
      </div>
    );
  }

  return (
    <CreativeLab
      analysis={analysis}
      narratives={narratives}
      campaignRows={campaignRows()}
    />
  );
}
