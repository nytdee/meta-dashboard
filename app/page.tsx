import fs from "node:fs";
import path from "node:path";
import Dashboard from "@/components/dashboard";
import dashboard from "@/public/data/dashboard.json";
import type { CreativeAnalysisFile } from "@/lib/creative/types";
import type { DashboardData } from "@/lib/types";

export const dynamic = "force-static";

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

export default function Home() {
  return (
    <Dashboard
      data={dashboard as unknown as DashboardData}
      analysis={readAnalysis()}
    />
  );
}
