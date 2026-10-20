export type DailyRow = {
  date: string;
  campaign: string;
  adset: string;
  ad: string;
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  leads: number;
  formLeads: number;
  websiteLeads: number;
  whatsappLeads: number;
  messengerLeads: number;
  messagingConnections: number;
  frequency: number;
};

export type DashboardTotals = {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
};

export type DashboardData = {
  generatedAt: string;
  summary: {
    minDate: string;
    maxDate: string;
    days: number;
    campaignRows: number;
    adRows: number;
    sourceFiles: number;
    source: "live" | "sample";
    liveMaxDate: string | null;
    totals: DashboardTotals;
  };
  campaign: DailyRow[];
  ads: DailyRow[];
};

export type Metrics = {
  leads: number;
  spend: number;
  clicks: number;
  impressions: number;
  reach: number;
  formLeads: number;
  websiteLeads: number;
  whatsappLeads: number;
  messengerLeads: number;
  messagingConnections: number;
  cpl: number | null;
  ctr: number | null;
  cpm: number | null;
  frequency: number | null;
};

export type DailyPoint = {
  date: string;
  label: string;
  leads: number;
  spend: number;
  clicks: number;
  impressions: number;
  reach: number;
  cpl: number | null;
  ctr: number | null;
};

export type BreakdownLevel = "campaign" | "adset" | "ad";

export type BreakdownRow = {
  key: string;
  campaign: string;
  adset: string;
  ad: string;
  leads: number;
  spend: number;
  clicks: number;
  impressions: number;
  reach: number;
  ctr: number | null;
  cpl: number | null;
};

export type RangeMode = "preset" | "custom";
export type CompareMode = "previous" | "custom" | "none";

export const PRESETS = [
  "Today",
  "Yesterday",
  "Last 7 days",
  "Last 14 days",
  "Last 30 days",
  "This month",
  "Last month",
] as const;

export type PresetKey = (typeof PRESETS)[number];
