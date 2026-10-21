import fs from "node:fs";
import path from "node:path";
import CreativeLab from "@/components/creative-lab";
import type {
  CreativeAnalysisFile,
  CreativeNarrativeFile,
} from "@/lib/creative/types";

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

  return <CreativeLab analysis={analysis} narratives={narratives} />;
}
