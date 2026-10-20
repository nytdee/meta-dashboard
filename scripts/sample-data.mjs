import { createHash } from "node:crypto";

const CREATIVES = [
  "Video - Doctor Intro",
  "Carousel - Results",
  "Static - Offer",
  "Reel - Testimonial",
  "Image - Before After",
  "Video - FAQ",
];

const AD_SETS = ["Broad", "Interest - Wellness", "Retargeting 30d"];

const CAMPAIGNS = [
  {
    name: "Leads Forms Campaigns – Updated",
    short: "LFC Updated",
    baseImpressions: 7600,
    cpm: 132,
    ctr: 1.42,
    conversion: 0.115,
    webShare: 0,
    whatsappShare: 0,
    messenger: 0.35,
  },
  {
    name: "Leads Forms Campaigns",
    short: "LFC",
    baseImpressions: 3200,
    cpm: 126,
    ctr: 1.3,
    conversion: 0.105,
    webShare: 0,
    whatsappShare: 0,
    messenger: 0.3,
  },
  {
    name: "Dr Shashidhar",
    short: "Dr Shashidhar",
    baseImpressions: 5400,
    cpm: 148,
    ctr: 1.02,
    conversion: 0.1,
    webShare: 1,
    whatsappShare: 0,
    messenger: 0.45,
  },
  {
    name: "Dr Prema - Direct Conversion",
    short: "Dr Prema",
    baseImpressions: 5900,
    cpm: 145,
    ctr: 1.08,
    conversion: 0.1,
    webShare: 1,
    whatsappShare: 0,
    messenger: 0.4,
  },
  {
    name: "Dr Binu  - Direct Conversion",
    short: "Dr Binu",
    baseImpressions: 6200,
    cpm: 140,
    ctr: 1.12,
    conversion: 0.1,
    webShare: 1,
    whatsappShare: 0,
    messenger: 0.4,
  },
  {
    name: "Dr Binu - Angle Expansion",
    short: "Dr Binu Angles",
    baseImpressions: 4600,
    cpm: 136,
    ctr: 1.04,
    conversion: 0.09,
    webShare: 1,
    whatsappShare: 0,
    messenger: 0.35,
  },
  {
    name: "Dr GG- HSR",
    short: "Dr GG HSR",
    baseImpressions: 4000,
    cpm: 150,
    ctr: 1.06,
    conversion: 0.09,
    webShare: 1,
    whatsappShare: 0,
    messenger: 0.3,
  },
  {
    name: "Website - Landing Pages - BOFU",
    short: "BOFU",
    baseImpressions: 3800,
    cpm: 118,
    ctr: 1.24,
    conversion: 0.08,
    webShare: 0.75,
    whatsappShare: 0,
    messenger: 0.3,
  },
  {
    name: "Wellness - Website – Copy",
    short: "Wellness",
    baseImpressions: 3100,
    cpm: 112,
    ctr: 1.18,
    conversion: 0.075,
    webShare: 0.6,
    whatsappShare: 0,
    messenger: 0.35,
  },
  {
    name: "General Website",
    short: "General Web",
    baseImpressions: 2300,
    cpm: 128,
    ctr: 1.0,
    conversion: 0.06,
    webShare: 1,
    whatsappShare: 0,
    messenger: 0.2,
  },
  {
    name: "WhatsApp - Enquiries",
    short: "WhatsApp",
    baseImpressions: 2600,
    cpm: 96,
    ctr: 1.9,
    conversion: 0.05,
    webShare: 0,
    whatsappShare: 0.12,
    messenger: 0.8,
  },
  {
    name: "Messenger - Enquiries",
    short: "Messenger",
    baseImpressions: 2200,
    cpm: 90,
    ctr: 2.1,
    conversion: 0.04,
    webShare: 0,
    whatsappShare: 0,
    messenger: 2.0,
    messagingBoost: true,
  },
];

function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function seedFrom(text) {
  return Number.parseInt(createHash("sha256").update(text).digest("hex").slice(0, 8), 16);
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function distribute(total, shares, random, decimals = 0) {
  let remaining = total;
  return shares.map((share, index) => {
    const isLast = index === shares.length - 1;
    if (isLast) {
      const value = remaining;
      remaining = 0;
      return value;
    }
    const scaled = remaining * share;
    const value = Math.min(
      remaining,
      Math.max(0, decimals > 0 ? round2(scaled) : Math.round(scaled)),
    );
    remaining = remaining - value;
    return value;
  });
}

export function generateSampleRows({ endDate, days = 90 }) {
  const random = mulberry32(seedFrom(`${endDate}:${days}:meta-dashboard`));
  const startDate = addDays(endDate, -(days - 1));
  const campaignRows = [];
  const adRows = [];

  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const date = addDays(startDate, dayIndex);
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const weekendFactor = weekday === 0 || weekday === 6 ? 0.82 : 1;
    const weeklyWave = 1 + 0.11 * Math.sin((dayIndex / 7) * Math.PI * 2);
    const monthlyWave = 1 + 0.06 * Math.sin((dayIndex / 30) * Math.PI * 2);
    const growth = 0.9 + (dayIndex / days) * 0.25;

    CAMPAIGNS.forEach((campaign, campaignIndex) => {
      const noise = 0.84 + random() * 0.32;
      const impressions = Math.max(
        250,
        Math.round(
          campaign.baseImpressions *
            weeklyWave *
            monthlyWave *
            weekendFactor *
            growth *
            noise,
        ),
      );
      const frequencyTarget = 1.15 + random() * 1.05;
      const reach = Math.max(120, Math.round(impressions / frequencyTarget));
      const ctr = Math.min(4.5, Math.max(0.25, campaign.ctr * (0.85 + random() * 0.3)));
      const clicks = Math.min(impressions, Math.round((impressions * ctr) / 100));
      const spend = round2((impressions / 1000) * campaign.cpm * (0.9 + random() * 0.2));
      const leads = Math.max(
        0,
        Math.round(clicks * campaign.conversion * (0.7 + random() * 0.6)),
      );
      const websiteLeads = Math.round(leads * campaign.webShare);
      const formLeads = leads - websiteLeads;
      const whatsappLeads = Math.round(
        clicks * campaign.whatsappShare * (0.6 + random() * 0.8),
      );
      const messengerLeads = Math.max(
        0,
        Math.round(leads * campaign.messenger + clicks * 0.015 * (0.4 + random())),
      );
      const messagingConnections =
        messengerLeads +
        Math.round(random() * (campaign.messagingBoost ? 6 : 2));

      campaignRows.push({
        date,
        campaign: campaign.name,
        adset: "",
        ad: "",
        impressions,
        reach,
        clicks,
        spend,
        leads: formLeads + websiteLeads,
        formLeads,
        websiteLeads,
        whatsappLeads,
        messengerLeads,
        messagingConnections,
        frequency: Math.round((impressions / reach) * 10000) / 10000,
      });

      const ads = [0, 1, 2].map((slot) => ({
        adset: `${campaign.short} · ${AD_SETS[(campaignIndex + slot) % AD_SETS.length]}`,
        ad: `${campaign.short} · ${CREATIVES[(campaignIndex + slot * 2) % CREATIVES.length]}`,
        weight: 0.6 + random() * 0.9,
      }));
      const totalWeight = ads.reduce((sum, ad) => sum + ad.weight, 0);
      const shares = ads.map((ad) => ad.weight / totalWeight);

      const impressionSplit = distribute(impressions, shares, random);
      const reachSplit = distribute(reach, shares, random);
      const clickSplit = distribute(clicks, shares, random);
      const spendSplit = distribute(spend, shares, random, 2);
      const formSplit = distribute(formLeads, shares, random);
      const websiteSplit = distribute(websiteLeads, shares, random);
      const whatsappSplit = distribute(whatsappLeads, shares, random);
      const messengerSplit = distribute(messengerLeads, shares, random);
      const connectionExtra = messagingConnections - messengerLeads;
      const extraSplit = distribute(connectionExtra, shares, random);

      ads.forEach((ad, adIndex) => {
        const adImpressions = impressionSplit[adIndex];
        const adReach = Math.max(1, reachSplit[adIndex]);
        const adLeads = formSplit[adIndex] + websiteSplit[adIndex];
        adRows.push({
          date,
          campaign: campaign.name,
          adset: ad.adset,
          ad: ad.ad,
          impressions: adImpressions,
          reach: adReach,
          clicks: clickSplit[adIndex],
          spend: spendSplit[adIndex],
          leads: adLeads,
          formLeads: formSplit[adIndex],
          websiteLeads: websiteSplit[adIndex],
          whatsappLeads: whatsappSplit[adIndex],
          messengerLeads: messengerSplit[adIndex],
          messagingConnections: messengerSplit[adIndex] + extraSplit[adIndex],
          frequency:
            Math.round((adImpressions / adReach) * 10000) / 10000,
        });
      });
    });
  }

  return { campaignRows, adRows };
}
