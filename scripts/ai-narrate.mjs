import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "data");
const ANALYSIS_FILE = path.join(OUT_DIR, "creative-analysis.json");
const NARRATIVE_FILE = path.join(OUT_DIR, "creative-narratives.json");

const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
const apiBase = (process.env.AI_API_BASE || "https://api.openai.com/v1").replace(
  /\/$/,
  "",
);
const model = process.env.AI_MODEL || "gpt-4o-mini";
const provider = process.env.AI_PROVIDER || "openai-compatible";

if (!fs.existsSync(ANALYSIS_FILE)) {
  throw new Error(
    "public/data/creative-analysis.json is missing. Run `npm run creative:analyze` first.",
  );
}

if (!apiKey) {
  console.log(
    "[creative:ai] skipped - no AI_API_KEY or OPENAI_API_KEY set. " +
      "The dashboard keeps using the deterministic, quantitative analysis.",
  );
  process.exit(0);
}

const analysis = JSON.parse(fs.readFileSync(ANALYSIS_FILE, "utf8"));

const SYSTEM_PROMPT = [
  "You are a creative strategist writing a short note for a paid-social dashboard.",
  "Hard rules:",
  "1. Write exactly two sentences per creative.",
  "2. Never include digits, numbers, currency amounts, percentages or dates. The engine renders all quantitative facts itself.",
  "3. Describe the observable creative pattern and the plausible mechanism, never a proven cause.",
  "4. Mention the specific creative angle, hook or proof device that is being used.",
  "5. Do not recommend pausing ads, changing budgets or automated actions.",
  "6. Reply with JSON only: {\"items\":[{\"id\":\"...\",\"narrative\":\"...\"}]}",
].join("\n");

function buildUserPrompt(batch) {
  const payload = batch.map((item) => ({
    id: item.creative.id,
    name: item.creative.name,
    format: item.creative.format,
    hook_text: item.creative.hookText,
    hook_type: item.creative.hookType,
    messaging_angles: item.creative.messagingAngles,
    proof_types: item.creative.proofTypes,
    offer_type: item.creative.offerType,
    cta_type: item.creative.ctaType,
    cta_text: item.creative.ctaText,
    visual_opening: item.creative.visualOpening,
    body_copy: item.creative.body,
    observed_text: item.creative.observed,
    engine_verdict: item.verdict,
    engine_rationale: item.rationale,
  }));
  return `Creative records:\n${JSON.stringify(payload, null, 2)}\n\nReturn one JSON object with an "items" array containing one entry per creative id.`;
}

function hasNumbers(text) {
  return /\d/.test(text);
}

async function callModel(batch) {
  const response = await fetch(`${apiBase}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(batch) },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI request failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content ?? "";
  const parsed = JSON.parse(content);
  return Array.isArray(parsed.items) ? parsed.items : [];
}

const creatives = analysis.creatives ?? [];
const items = {};
const rejected = [];

for (let index = 0; index < creatives.length; index += 6) {
  const batch = creatives.slice(index, index + 6);
  try {
    const results = await callModel(batch);
    for (const result of results) {
      const narrative = String(result.narrative ?? "").trim();
      if (!narrative) continue;
      if (hasNumbers(narrative)) {
        rejected.push(result.id);
        continue;
      }
      items[result.id] = narrative;
    }
  } catch (error) {
    console.warn(`[creative:ai] ${error.message}`);
  }
}

if (Object.keys(items).length === 0) {
  console.warn(
    "[creative:ai] no usable narratives were produced. The dashboard keeps the deterministic analysis.",
  );
  process.exit(0);
}

const output = {
  generatedAt: new Date().toISOString(),
  model,
  provider,
  grounded: true,
  items,
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(NARRATIVE_FILE, JSON.stringify(output, null, 2));

console.log(
  `[creative:ai] ${Object.keys(items).length} narratives written with ${model} ` +
    `(rejected ${rejected.length} containing numbers) → ${path.relative(ROOT, NARRATIVE_FILE)}`,
);
