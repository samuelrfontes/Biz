import { WorkerType, WORKER_META } from "../types";
import { completeJSON, isLLMEnabled } from "./llm";

// ─────────────────────────────────────────────────────────────────────────
// ONBOARDING / WORKSPACE CONFIGURATION
//
// The front door to Bossman. A new owner describes their business in their own
// words; suggestWorkspace() turns that into a fully configured workspace —
// kind, mandate, tone, which agents to activate, and starter guardrails.
//
// Nothing is niche-locked: an unknown business still gets a sensible operator
// out of the generic profile. When ANTHROPIC_API_KEY is set, Claude refines the
// draft; otherwise the heuristic below runs (and is what the tests exercise).
// ─────────────────────────────────────────────────────────────────────────

export interface WorkspaceDraft {
  name: string;
  kind: string;
  emoji: string;
  mandate: string;
  toneWords: string[];
  enabledWorkers: WorkerType[];
  guardrails: string[];
  source: "heuristic" | "llm";
}

interface Category {
  match: RegExp;
  kind: string;
  emoji: string;
  workers: WorkerType[];
  tone: string[];
}

// Each category proves the same engine adapts to a different business. The
// list is illustrative, not exhaustive — the generic fallback covers the rest.
const CATEGORIES: Category[] = [
  {
    match: /\b(nail|lash|salon|spa|beauty|hair|barber|brow|wax|aesthetic)\b/i,
    kind: "Beauty & personal care",
    emoji: "💅",
    workers: ["front_desk", "scheduling", "sales_followup", "reputation", "marketing", "cfo"],
    tone: ["warm", "premium", "never desperate"],
  },
  {
    match: /\b(law|legal|attorney|lawyer|firm|paralegal|counsel)\b/i,
    kind: "Legal practice",
    emoji: "⚖️",
    workers: ["front_desk", "scheduling", "support", "operations", "cfo"],
    tone: ["professional", "precise", "reassuring"],
  },
  {
    match: /\b(dental|dentist|clinic|medical|doctor|chiro|therapy|health|med spa|medspa)\b/i,
    kind: "Health practice",
    emoji: "🩺",
    workers: ["front_desk", "scheduling", "support", "reputation", "operations"],
    tone: ["caring", "clean", "professional"],
  },
  {
    match: /\b(shop|store|ecommerce|e-commerce|online|brand|product|retail|dtc|shopify)\b/i,
    kind: "E-commerce brand",
    emoji: "🛍️",
    workers: ["support", "sales_followup", "reputation", "marketing", "cfo", "operations"],
    tone: ["upbeat", "on-brand", "helpful"],
  },
  {
    match: /\b(contractor|plumb|hvac|roof|electric|landscap|construct|handyman|home service|cleaning)\b/i,
    kind: "Home services",
    emoji: "🔨",
    workers: ["front_desk", "scheduling", "sales_followup", "operations", "cfo"],
    tone: ["straightforward", "trustworthy", "no-nonsense"],
  },
  {
    match: /\b(real estate|realtor|broker|property|listing|rental|lease)\b/i,
    kind: "Real estate",
    emoji: "🏠",
    workers: ["front_desk", "sales_followup", "scheduling", "marketing", "cfo"],
    tone: ["polished", "responsive", "confident"],
  },
  {
    match: /\b(restaurant|cafe|coffee|bar|catering|food|bakery|kitchen)\b/i,
    kind: "Food & hospitality",
    emoji: "🍽️",
    workers: ["front_desk", "scheduling", "reputation", "marketing", "operations"],
    tone: ["friendly", "inviting", "prompt"],
  },
  {
    match: /\b(gym|fitness|studio|yoga|pilates|coach|trainer|wellness)\b/i,
    kind: "Fitness & wellness",
    emoji: "🏋️",
    workers: ["front_desk", "scheduling", "sales_followup", "reputation", "marketing"],
    tone: ["motivating", "warm", "energetic"],
  },
  {
    match: /\b(agency|consult|marketing|studio|design|freelance|service business)\b/i,
    kind: "Agency / services",
    emoji: "💼",
    workers: ["front_desk", "sales_followup", "support", "operations", "cfo"],
    tone: ["sharp", "professional", "proactive"],
  },
];

const GENERIC: Omit<Category, "match"> = {
  kind: "Business",
  emoji: "🏢",
  workers: ["front_desk", "scheduling", "support", "operations", "cfo"],
  tone: ["professional", "warm", "responsive"],
};

function categorize(description: string): Omit<Category, "match"> {
  return CATEGORIES.find((c) => c.match.test(description)) ?? GENERIC;
}

/** Pull a plausible business name from the description, else a friendly default.
 *  Proper names tend to be Capitalized and free of filler verbs, so we prefer a
 *  "called/named X" or "run X" capture and reject sentence-y matches. */
function inferName(description: string): string {
  // A name is a run of Capitalized words, allowing "&"/"and" as connectors.
  const NAME = "([A-Z][\\w'’\\-]*(?:\\s+(?:&|and|[A-Z][\\w'’\\-]*)){0,5})";
  const candidates = [
    description.match(new RegExp(`\\b(?:called|named)\\s+${NAME}`)),
    description.match(new RegExp(`\\b(?:run|own|manage)\\s+(?:a|an|my|the)?\\s*${NAME}`)),
    description.match(new RegExp(`^${NAME}\\b`)),
  ];
  for (const m of candidates) {
    if (!m) continue;
    const name = m[1].trim().replace(/\s+(and|&)$/i, "").trim();
    // Reject sentence fragments ("We are…", "I sell…") — real names don't lead
    // with a pronoun or contain a linking verb.
    if (/^(we|i|our|my|they|it)\b/i.test(name)) continue;
    if (/\b(are|is)\b/i.test(name)) continue;
    if (name.length >= 3) return name;
  }
  return "Your Business";
}

function buildMandate(description: string, cat: Omit<Category, "match">): string {
  const d = description.trim();
  if (d.length > 20 && d.length < 180) return d;
  return `Run the front line of my ${cat.kind.toLowerCase()} — answer customers, keep the schedule full, and grow revenue.`;
}

const BASE_GUARDRAILS = [
  "Answer calls & texts and book/reschedule on your own",
  "Discounts up to 10% without approval",
  "Mass texts, public posts, and refunds need my sign-off",
  "Sensitive or unhappy customers always come to me first",
];

export function suggestWorkspaceHeuristic(description: string): WorkspaceDraft {
  const cat = categorize(description);
  const explicitlyMentioned: WorkerType[] = [];
  if (/\b(review|reputation|rating|star)\b/i.test(description)) explicitlyMentioned.push("reputation");
  if (/\b(market|promo|campaign|social|post)\b/i.test(description)) explicitlyMentioned.push("marketing");
  if (/\b(follow.?up|rebook|win.?back|abandoned|lead)\b/i.test(description)) explicitlyMentioned.push("sales_followup");

  const enabledWorkers = Array.from(new Set([...cat.workers, ...explicitlyMentioned]));

  return {
    name: inferName(description),
    kind: cat.kind,
    emoji: cat.emoji,
    mandate: buildMandate(description, cat),
    toneWords: cat.tone,
    enabledWorkers,
    guardrails: BASE_GUARDRAILS,
    source: "heuristic",
  };
}

/** Public entry: try the LLM, fall back to the heuristic. Always resolves. */
export async function suggestWorkspace(description: string): Promise<WorkspaceDraft> {
  const baseline = suggestWorkspaceHeuristic(description);
  if (!isLLMEnabled()) return baseline;

  const workerList = Object.entries(WORKER_META)
    .map(([k, v]) => `${k} (${v.title})`)
    .join(", ");

  const llm = await completeJSON<Partial<WorkspaceDraft>>({
    system:
      "You are Bossman, an AI operator onboarding a new business owner. From their description, produce a workspace config.",
    user: `Business description: "${description}"\n\nReturn JSON with keys: name (string), kind (short label), mandate (one sentence in the owner's voice), toneWords (3 short strings), enabledWorkers (subset of: ${workerList}). Choose only workers that fit.`,
    maxTokens: 600,
  });

  if (!llm) return baseline;

  // Merge LLM suggestions over the heuristic, validating worker ids.
  const validWorkers = (llm.enabledWorkers ?? []).filter(
    (w): w is WorkerType => (w as string) in WORKER_META,
  );
  return {
    ...baseline,
    name: llm.name?.trim() || baseline.name,
    kind: llm.kind?.trim() || baseline.kind,
    mandate: llm.mandate?.trim() || baseline.mandate,
    toneWords: llm.toneWords?.length ? llm.toneWords.slice(0, 3) : baseline.toneWords,
    enabledWorkers: validWorkers.length ? validWorkers : baseline.enabledWorkers,
    source: "llm",
  };
}
