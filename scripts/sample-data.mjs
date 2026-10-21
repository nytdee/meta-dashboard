import { createHash } from "node:crypto";

export const CREATIVE_CONCEPTS = [
  {
    id: "cr_01",
    name: "Video - Doctor Intro",
    format: "founder/expert video",
    headline: "PCOS care, personalised for you",
    body: "Dr Meera explains why generic PCOS advice fails, and what a hormone-led plan actually looks like.",
    hookText: "Struggling with PCOS and nobody listens?",
    hookType: "problem/pain",
    messagingAngles: ["problem", "trust/proof"],
    proofTypes: ["expert explanation"],
    offerType: "free consultation",
    ctaType: "BOOK_NOW",
    ctaText: "Book a free consult",
    visualOpening: "person speaking",
    language: "en",
    observed: [
      { text: "Struggling with PCOS and nobody listens?", source: "transcript" },
      { text: "Book a free consult", source: "ocr" },
    ],
    ctrMult: 1.25,
    convMult: 1.35,
    spendMult: 1.0,
  },
  {
    id: "cr_02",
    name: "Carousel - Results",
    format: "carousel",
    headline: "Real hormone results, month by month",
    body: "Six real client timelines with the exact changes they tracked each month.",
    hookText: "Month 1 vs month 4: same patient, different plan",
    hookType: "social proof",
    messagingAngles: ["trust/proof", "aspiration"],
    proofTypes: ["testimonial", "data/evidence"],
    offerType: "no explicit offer",
    ctaType: "LEARN_MORE",
    ctaText: "See all results",
    visualOpening: "result/outcome",
    language: "en",
    observed: [
      { text: "Month 1 vs month 4", source: "ocr" },
      { text: "See all results", source: "ocr" },
    ],
    ctrMult: 1.35,
    convMult: 1.2,
    spendMult: 1.05,
  },
  {
    id: "cr_03",
    name: "Static - Offer",
    format: "static image",
    headline: "First consultation at ₹499",
    body: "Full hormone assessment and a personalised plan, first consultation at an introductory price.",
    hookText: "First consultation ₹499",
    hookType: "offer-first",
    messagingAngles: ["price/value", "convenience"],
    proofTypes: ["guarantee/policy"],
    offerType: "discount",
    ctaType: "SHOP_NOW",
    ctaText: "Claim the offer",
    visualOpening: "text-led",
    language: "en",
    observed: [{ text: "First consultation ₹499", source: "ocr" }],
    ctrMult: 1.1,
    convMult: 0.95,
    spendMult: 1.0,
  },
  {
    id: "cr_04",
    name: "Reel - Testimonial",
    format: "UGC-style video",
    headline: "I finally understood my hormones",
    body: "A customer explains the moment she stopped guessing and started tracking.",
    hookText: "I finally understood my own hormones",
    hookType: "social proof",
    messagingAngles: ["trust/proof", "problem"],
    proofTypes: ["testimonial"],
    offerType: "no explicit offer",
    ctaType: "SIGN_UP",
    ctaText: "Get your plan",
    visualOpening: "person speaking",
    language: "en",
    observed: [
      { text: "I finally understood my own hormones", source: "transcript" },
    ],
    ctrMult: 1.45,
    convMult: 1.5,
    spendMult: 1.1,
  },
  {
    id: "cr_05",
    name: "Image - Before After",
    format: "static image",
    headline: "A tracked change, not a miracle",
    body: "Side-by-side progress chart with the tracking steps that produced it.",
    hookText: "This is what 12 weeks of tracking actually looks like",
    hookType: "surprising claim",
    messagingAngles: ["aspiration", "trust/proof"],
    proofTypes: ["demonstration", "data/evidence"],
    offerType: "no explicit offer",
    ctaType: "LEARN_MORE",
    ctaText: "See the plan",
    visualOpening: "result/outcome",
    language: "en",
    observed: [{ text: "12 weeks of tracking", source: "ocr" }],
    ctrMult: 1.2,
    convMult: 1.1,
    spendMult: 1.0,
  },
  {
    id: "cr_06",
    name: "Video - FAQ",
    format: "product demo",
    headline: "Questions we get every week",
    body: "Three common hormone questions answered in under a minute.",
    hookText: "Is the pill the only way to fix PCOS?",
    hookType: "question",
    messagingAngles: ["education", "objection handling"],
    proofTypes: ["expert explanation"],
    offerType: "no explicit offer",
    ctaType: "LEARN_MORE",
    ctaText: "Read the guide",
    visualOpening: "person speaking",
    language: "en",
    observed: [{ text: "Is the pill the only way to fix PCOS?", source: "transcript" }],
    ctrMult: 0.8,
    convMult: 0.6,
    spendMult: 1.15,
  },
  {
    id: "cr_07",
    name: "Reel - Before After",
    format: "UGC-style video",
    headline: "What changed in 90 days",
    body: "A day-in-the-life walkthrough of tracking, training and sleep changes.",
    hookText: "90 days. No pills. Here is what changed.",
    hookType: "problem/pain",
    messagingAngles: ["problem", "aspiration"],
    proofTypes: ["demonstration"],
    offerType: "no explicit offer",
    ctaType: "SIGN_UP",
    ctaText: "Start tracking",
    visualOpening: "person speaking",
    language: "en",
    observed: [{ text: "90 days. No pills.", source: "transcript" }],
    ctrMult: 1.15,
    convMult: 1.25,
    spendMult: 1.0,
  },
  {
    id: "cr_08",
    name: "Static - Price List",
    format: "static image",
    headline: "Our full pricing",
    body: "A table of every plan, price and consultation length.",
    hookText: "Our full pricing",
    hookType: "other/unknown",
    messagingAngles: ["price/value"],
    proofTypes: ["data/evidence"],
    offerType: "price/value",
    ctaType: "LEARN_MORE",
    ctaText: "See pricing",
    visualOpening: "text-led",
    language: "en",
    observed: [{ text: "Our full pricing", source: "ocr" }],
    ctrMult: 0.7,
    convMult: 0.25,
    spendMult: 1.5,
  },
  {
    id: "cr_09",
    name: "Video - Founder Story",
    format: "founder/expert video",
    headline: "Why we built a hormone-first clinic",
    body: "The founder explains the gap she saw in women's healthcare.",
    hookText: "I built this because I could not get a straight answer",
    hookType: "founder/expert-led",
    messagingAngles: ["trust/proof", "education"],
    proofTypes: ["testimonial", "expert explanation"],
    offerType: "no explicit offer",
    ctaType: "LEARN_MORE",
    ctaText: "Read our story",
    visualOpening: "person speaking",
    language: "en",
    observed: [{ text: "I built this because", source: "transcript" }],
    ctrMult: 1.05,
    convMult: 1.05,
    spendMult: 0.95,
  },
  {
    id: "cr_10",
    name: "Carousel - 5 Reasons",
    format: "carousel",
    headline: "Five reasons to test your hormones",
    body: "Five short cards, each covering one signal that a hormone panel can reveal.",
    hookText: "Five signals your body is sending you",
    hookType: "benefit-first",
    messagingAngles: ["problem", "education"],
    proofTypes: ["data/evidence"],
    offerType: "no explicit offer",
    ctaType: "LEARN_MORE",
    ctaText: "Check your symptoms",
    visualOpening: "text-led",
    language: "en",
    observed: [{ text: "Five signals your body is sending you", source: "ocr" }],
    ctrMult: 1.0,
    convMult: 0.85,
    spendMult: 1.0,
  },
  {
    id: "cr_11",
    name: "Static - Consultation Offer",
    format: "static image",
    headline: "Free 20-minute hormone call",
    body: "Book a free call and leave with a plain-English summary of your panel.",
    hookText: "Free 20-minute hormone call",
    hookType: "offer-first",
    messagingAngles: ["convenience", "price/value"],
    proofTypes: ["expert explanation", "guarantee/policy"],
    offerType: "free consultation",
    ctaType: "BOOK_NOW",
    ctaText: "Book the call",
    visualOpening: "text-led",
    language: "en",
    observed: [{ text: "Free 20-minute hormone call", source: "ocr" }],
    ctrMult: 1.3,
    convMult: 1.4,
    spendMult: 1.05,
  },
  {
    id: "cr_12",
    name: "Reel - Clinic Tour",
    format: "UGC-style video",
    headline: "A look inside the clinic",
    body: "A quick walk through the clinic, the team and the testing process.",
    hookText: "Ever wondered what a hormone consultation looks like?",
    hookType: "curiosity",
    messagingAngles: ["convenience", "education"],
    proofTypes: ["demonstration"],
    offerType: "no explicit offer",
    ctaType: "BOOK_NOW",
    ctaText: "Book a visit",
    visualOpening: "scene/context",
    language: "en",
    observed: [{ text: "What a hormone consultation looks like", source: "transcript" }],
    ctrMult: 0.95,
    convMult: 0.9,
    spendMult: 1.0,
  },
  {
    id: "cr_13",
    name: "Image - Expert Quote",
    format: "static image",
    headline: "What an endocrinologist says",
    body: "A quoted clinician explanation of why timing matters for hormone panels.",
    hookText: "Timing changes your results",
    hookType: "social proof",
    messagingAngles: ["trust/proof", "education"],
    proofTypes: ["expert explanation"],
    offerType: "no explicit offer",
    ctaType: "LEARN_MORE",
    ctaText: "Read the guidance",
    visualOpening: "text-led",
    language: "en",
    observed: [{ text: "Timing changes your results", source: "ocr" }],
    ctrMult: 1.1,
    convMult: 1.15,
    spendMult: 0.95,
  },
  {
    id: "cr_14",
    name: "Video - Myth Busting",
    format: "founder/expert video",
    headline: "Three PCOS myths, answered",
    body: "A doctor debunks three common claims and explains what to do instead.",
    hookText: "Stop doing this if your PCOS",
    hookType: "surprising claim",
    messagingAngles: ["objection handling", "education"],
    proofTypes: ["expert explanation", "data/evidence"],
    offerType: "no explicit offer",
    ctaType: "LEARN_MORE",
    ctaText: "Get the facts",
    visualOpening: "person speaking",
    language: "en",
    observed: [{ text: "Three PCOS myths", source: "transcript" }],
    ctrMult: 1.25,
    convMult: 1.1,
    spendMult: 1.0,
  },
  {
    id: "cr_15",
    name: "Static - Free Ebook",
    format: "static image",
    headline: "Free hormone symptom tracker",
    body: "Download a printable tracker and log symptoms for one cycle.",
    hookText: "Free hormone symptom tracker",
    hookType: "benefit-first",
    messagingAngles: ["convenience", "education"],
    proofTypes: ["guarantee/policy"],
    offerType: "free trial/sample",
    ctaType: "DOWNLOAD",
    ctaText: "Download the tracker",
    visualOpening: "text-led",
    language: "en",
    observed: [{ text: "Free hormone symptom tracker", source: "ocr" }],
    ctrMult: 0.75,
    convMult: 0.45,
    spendMult: 1.1,
  },
  {
    id: "cr_16",
    name: "Reel - Doctor Explains",
    format: "UGC-style video",
    headline: "The doctor explains your results",
    body: "A short explanation of what a hormone panel means in plain language.",
    hookText: "Your results, explained in 60 seconds",
    hookType: "problem/pain",
    messagingAngles: ["problem", "education"],
    proofTypes: ["expert explanation", "demonstration"],
    offerType: "no explicit offer",
    ctaType: "SIGN_UP",
    ctaText: "Get your report",
    visualOpening: "person speaking",
    language: "en",
    observed: [{ text: "Your results, explained", source: "transcript" }],
    ctrMult: 1.2,
    convMult: 1.3,
    spendMult: 1.0,
  },
  {
    id: "cr_17",
    name: "Image - Comparison Chart",
    format: "static image",
    headline: "Generic advice vs hormone-led care",
    body: "A comparison chart of two approaches and their outcomes.",
    hookText: "Generic advice vs hormone-led care",
    hookType: "surprising claim",
    messagingAngles: ["comparison", "price/value"],
    proofTypes: ["data/evidence"],
    offerType: "no explicit offer",
    ctaType: "LEARN_MORE",
    ctaText: "Compare approaches",
    visualOpening: "text-led",
    language: "en",
    observed: [{ text: "Generic advice vs hormone-led care", source: "ocr" }],
    ctrMult: 0.9,
    convMult: 0.7,
    spendMult: 1.05,
  },
  {
    id: "cr_18",
    name: "Video - Patient Story",
    format: "UGC-style video",
    headline: "A patient explains the turning point",
    body: "A patient describes the symptom she ignored and the change that followed.",
    hookText: "I almost did not book the consultation",
    hookType: "social proof",
    messagingAngles: ["problem", "trust/proof"],
    proofTypes: ["testimonial"],
    offerType: "no explicit offer",
    ctaType: "BOOK_NOW",
    ctaText: "Book a consultation",
    visualOpening: "person speaking",
    language: "en",
    observed: [{ text: "I almost did not book the consultation", source: "transcript" }],
    ctrMult: 1.4,
    convMult: 1.45,
    spendMult: 1.05,
  },
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
  return Number.parseInt(
    createHash("sha256").update(text).digest("hex").slice(0, 8),
    16,
  );
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

function normalise(values) {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return values.map(() => 1 / values.length);
  return values.map((value) => value / total);
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
      const ctr = Math.min(
        4.5,
        Math.max(0.25, campaign.ctr * (0.85 + random() * 0.3)),
      );
      const clicks = Math.min(impressions, Math.round((impressions * ctr) / 100));
      const spend = round2((impressions / 1000) * campaign.cpm * (0.9 + random() * 0.2));
      const leads = Math.max(
        0,
        Math.round(clicks * campaign.conversion * (0.7 + random() * 0.6)),
      );
      const websiteLeadsTarget = Math.round(leads * campaign.webShare);
      const whatsappLeadsTarget = Math.round(
        clicks * campaign.whatsappShare * (0.6 + random() * 0.8),
      );
      const messengerLeadsTarget = Math.max(
        0,
        Math.round(leads * campaign.messenger + clicks * 0.015 * (0.4 + random())),
      );
      const messagingConnectionsTarget =
        messengerLeadsTarget +
        Math.round(random() * (campaign.messagingBoost ? 6 : 2));

      const slots = [0, 1, 2].map((slot) => {
        const creative =
          CREATIVE_CONCEPTS[(campaignIndex * 3 + slot) % CREATIVE_CONCEPTS.length];
        return {
          creative,
          adset: `${campaign.short} · ${AD_SETS[(campaignIndex + slot) % AD_SETS.length]}`,
          ad: `${campaign.short} · ${creative.name}`,
          weight: 0.6 + random() * 0.9,
        };
      });

      const impressionShares = normalise(slots.map((slot) => slot.weight));
      const clickShares = normalise(
        slots.map((slot) => slot.weight * slot.creative.ctrMult),
      );
      const leadShares = normalise(
        slots.map((slot) => slot.weight * slot.creative.convMult),
      );
      const spendShares = normalise(
        slots.map((slot) => slot.weight * slot.creative.spendMult),
      );

      const impressionSplit = distribute(impressions, impressionShares, random);
      const reachSplit = distribute(reach, impressionShares, random);
      const clickSplit = distribute(clicks, clickShares, random);
      const spendSplit = distribute(spend, spendShares, random, 2);
      const leadSplit = distribute(leads, leadShares, random);
      const websiteSplit = distribute(websiteLeadsTarget, leadShares, random);
      const whatsappSplit = distribute(
        whatsappLeadsTarget,
        impressionShares,
        random,
      );
      const messengerSplit = distribute(
        messengerLeadsTarget,
        impressionShares,
        random,
      );
      const connectionExtra = messagingConnectionsTarget - messengerLeadsTarget;
      const extraSplit = distribute(connectionExtra, impressionShares, random);

      const dayAds = slots.map((slot, adIndex) => {
        const adLeads = leadSplit[adIndex];
        const adWebsiteLeads = Math.min(
          adLeads,
          websiteSplit[adIndex],
        );
        const adReach = Math.max(1, reachSplit[adIndex]);
        return {
          date,
          campaign: campaign.name,
          adset: slot.adset,
          ad: slot.ad,
          creativeId: slot.creative.id,
          impressions: impressionSplit[adIndex],
          reach: adReach,
          clicks: clickSplit[adIndex],
          spend: spendSplit[adIndex],
          leads: adLeads,
          formLeads: adLeads - adWebsiteLeads,
          websiteLeads: adWebsiteLeads,
          whatsappLeads: whatsappSplit[adIndex],
          messengerLeads: messengerSplit[adIndex],
          messagingConnections: messengerSplit[adIndex] + extraSplit[adIndex],
          frequency: Math.round(
            (impressionSplit[adIndex] / adReach) * 10000,
          ) / 10000,
        };
      });

      adRows.push(...dayAds);

      const totals = dayAds.reduce(
        (sum, ad) => ({
          impressions: sum.impressions + ad.impressions,
          reach: sum.reach + ad.reach,
          clicks: sum.clicks + ad.clicks,
          spend: sum.spend + ad.spend,
          leads: sum.leads + ad.leads,
          formLeads: sum.formLeads + ad.formLeads,
          websiteLeads: sum.websiteLeads + ad.websiteLeads,
          whatsappLeads: sum.whatsappLeads + ad.whatsappLeads,
          messengerLeads: sum.messengerLeads + ad.messengerLeads,
          messagingConnections:
            sum.messagingConnections + ad.messagingConnections,
        }),
        {
          impressions: 0,
          reach: 0,
          clicks: 0,
          spend: 0,
          leads: 0,
          formLeads: 0,
          websiteLeads: 0,
          whatsappLeads: 0,
          messengerLeads: 0,
          messagingConnections: 0,
        },
      );

      campaignRows.push({
        date,
        campaign: campaign.name,
        adset: "",
        ad: "",
        impressions: totals.impressions,
        reach: totals.reach,
        clicks: totals.clicks,
        spend: round2(totals.spend),
        leads: totals.formLeads + totals.websiteLeads,
        formLeads: totals.formLeads,
        websiteLeads: totals.websiteLeads,
        whatsappLeads: totals.whatsappLeads,
        messengerLeads: totals.messengerLeads,
        messagingConnections: totals.messagingConnections,
        frequency:
          Math.round((totals.impressions / Math.max(1, totals.reach)) * 10000) /
          10000,
      });
    });
  }

  return { campaignRows, adRows, creatives: CREATIVE_CONCEPTS };
}
