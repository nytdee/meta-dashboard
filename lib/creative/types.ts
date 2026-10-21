export type CreativeFieldSource =
  | "api"
  | "ocr"
  | "transcript"
  | "model"
  | "rule"
  | "manual"
  | "sample";

export type CreativeMeta = {
  id: string;
  name: string;
  format: string;
  headline: string;
  body: string;
  hookText: string;
  hookType: string;
  messagingAngles: string[];
  proofTypes: string[];
  offerType: string;
  ctaType: string;
  ctaText: string;
  visualOpening: string;
  language: string;
  observed: Array<{ text: string; source: string }>;
  mediaAvailable?: boolean;
  mediaNote?: string;
  source?: "sample" | "manual" | "api";
  analysisVersion?: string;
};

export type CreativeVerdict = "replicate" | "test" | "hold" | "stop";

export type CreativePerformance = {
  creativeId: string;
  name: string;
  campaigns: string[];
  ads: string[];
  days: number;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  reach: number;
  ctr: number | null;
  cpl: number | null;
  leadShare: number;
  spendShare: number;
  vsBaselineCpl: number | null;
  vsBaselineCtr: number | null;
};

export type TagCohort = {
  dimension:
    | "hook"
    | "angle"
    | "proof"
    | "offer"
    | "cta"
    | "format";
  tag: string;
  creatives: number;
  ads: number;
  spend: number;
  leads: number;
  impressions: number;
  clicks: number;
  ctr: number | null;
  cpl: number | null;
  leadShare: number;
  spendShare: number;
  vsBaselineCpl: number | null;
  vsBaselineCtr: number | null;
  sampleStatus: "sufficient" | "low" | "insufficient";
};

export type CreativeInsight = {
  creative: CreativeMeta;
  performance: CreativePerformance;
  daily: Array<{
    date: string;
    spend: number;
    leads: number;
    clicks: number;
    impressions: number;
    cpl: number;
    ctr: number;
  }>;
  adBreakdown: Array<{
    ad: string;
    campaign: string;
    adset: string;
    days: number;
    spend: number;
    leads: number;
    clicks: number;
    impressions: number;
    cpl: number;
    ctr: number;
  }>;
  verdict: CreativeVerdict;
  summary: string;
  confidence: number;
  confidenceLabel: "high" | "medium" | "low";
  rationale: string[];
  evidence: {
    baselineCpl: number | null;
    baselineCtr: number | null;
    vsBaselineCpl: number | null;
    vsBaselineCtr: number | null;
    leadShare: number;
    spendShare: number;
    days: number;
    ads: number;
    creatives: number;
    minLeads: number;
    minSpend: number;
  };
  supportingCohorts: Array<{
    dimension: string;
    tag: string;
    vsBaselineCpl: number | null;
    leadShare: number;
    sampleStatus: string;
  }>;
};

export type CreativeAnalysisFile = {
  generatedAt: string;
  analysisVersion: string;
  source: "live" | "sample";
  mode: "demo" | "live";
  baseline: {
    spend: number;
    leads: number;
    impressions: number;
    clicks: number;
    ctr: number | null;
    cpl: number | null;
    creatives: number;
    ads: number;
    days: number;
  };
  thresholds: {
    minSpend: number;
    minLeads: number;
    minImpressions: number;
    minAds: number;
    cohortMinSpend: number;
    cohortMinLeads: number;
    cohortMinImpressions: number;
  };
  creatives: CreativeInsight[];
  cohorts: TagCohort[];
  issues: string[];
};

export type CreativeNarrativeFile = {
  generatedAt: string;
  model: string;
  provider: string;
  grounded: true;
  items: Record<string, string>;
};
