export function ratio(
  numerator: number,
  denominator: number,
  scale = 1,
): number | null {
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator <= 0
  ) {
    return null;
  }
  return (numerator / denominator) * scale;
}

export const costPerLead = (spend: number, leads: number) =>
  ratio(spend, leads);

export const clickThroughRate = (clicks: number, impressions: number) =>
  ratio(clicks, impressions, 100);

export const costPerThousand = (spend: number, impressions: number) =>
  ratio(spend, impressions, 1000);

export const averageFrequency = (impressions: number, reach: number) =>
  ratio(impressions, reach);

export type MetricDefinition = {
  key: string;
  label: string;
  definition: string;
  caveat?: string;
};

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    key: "leads",
    label: "Leads",
    definition:
      "Form leads plus website leads as reported by Meta (onsite_conversion.lead_grouped).",
    caveat:
      "Meta-reported leads are not qualified leads unless a CRM or manual outcome source is connected.",
  },
  {
    key: "formLeads",
    label: "Instant Form leads",
    definition:
      "Total Meta leads minus website leads (onsite_web_lead).",
    caveat:
      "This assumes website leads are included in Meta's grouped lead total. The Phase 0 audit verifies that assumption per account.",
  },
  {
    key: "websiteLeads",
    label: "Website leads",
    definition:
      "Leads attributed to the website pixel via onsite_web_lead.",
  },
  {
    key: "whatsappLeads",
    label: "WhatsApp clicks",
    definition:
      "Messaging replies attributed to WhatsApp (messaging_whatsapp_reply).",
    caveat:
      "Tracked separately from the lead total; it is not added into Leads.",
  },
  {
    key: "messengerLeads",
    label: "Messenger conversations",
    definition:
      "First replies attributed to Messenger (messaging_first_reply).",
    caveat:
      "Tracked separately from the lead total; it is not added into Leads.",
  },
  {
    key: "messagingConnections",
    label: "Messaging connections",
    definition:
      "Total messaging connections recorded by Meta (total_messaging_connection).",
    caveat:
      "Can overlap with Messenger and WhatsApp outcomes. Not part of the lead total.",
  },
  {
    key: "spend",
    label: "Spend",
    definition: "Amount spent in the account currency.",
  },
  {
    key: "cpl",
    label: "CPL",
    definition: "Total spend divided by total leads.",
    caveat:
      "Calculated from totals, never by averaging row-level CPLs.",
  },
  {
    key: "ctr",
    label: "CTR",
    definition:
      "Meta clicks divided by impressions, multiplied by 100.",
    caveat:
      "This uses the Meta clicks field, not link clicks or outbound clicks.",
  },
  {
    key: "cpm",
    label: "CPM",
    definition: "Spend divided by impressions, multiplied by 1,000.",
  },
  {
    key: "frequency",
    label: "Frequency",
    definition: "Impressions divided by reach at the same scope.",
  },
  {
    key: "reach",
    label: "Summed reach",
    definition:
      "Sum of daily and campaign-level reach values for the selected rows.",
    caveat:
      "This is not unique reach. People reached on multiple days or campaigns are counted more than once. Do not compare campaign-level and ad-level reach totals.",
  },
];
