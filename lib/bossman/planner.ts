import { RiskLevel, WorkerType } from "../types";
import { route } from "../router/router";
import { Objective } from "../router/types";

// ─────────────────────────────────────────────────────────────────────────
// BOSSMAN PLANNER
//
// The seam between "what the owner said" and "AI work". Given a natural-language
// message, Bossman detects intent, extracts constraints, and produces an
// ActionPlan whose every step is assigned a model by the REAL router (route()).
//
// Today the intent detection is heuristic so the demo is deterministic and
// offline. In production this same function signature is backed by an LLM call
// (Claude Opus) that emits the structured plan — the router, steps, approval
// gates, and everything downstream stay exactly as they are.
// ─────────────────────────────────────────────────────────────────────────

export type Intent =
  | "fill_capacity"
  | "recover_customer"
  | "run_promo"
  | "reputation"
  | "general";

export interface DetectedGoal {
  intent: Intent;
  goal: string;
  constraints: string[];
  /** e.g. a discount ceiling pulled out of the message. */
  discountCapPct?: number;
}

export interface PlannedStep {
  worker: WorkerType;
  title: string;
  detail: string;
  objective: Objective;
  /** chosen by the router at plan time */
  model: string;
  modelId: string;
  rationale: string;
  requiresApproval: boolean;
  risk: RiskLevel;
}

export interface BossmanPlan {
  message: string;
  intent: Intent;
  goal: string;
  constraints: string[];
  steps: PlannedStep[];
}

// --- intent detection -------------------------------------------------------

const RX = {
  slow: /\b(slow|quiet|empty|dead|fill|book|rebook|openings?|chairs?|slots?)\b/i,
  unhappy: /\b(unhappy|upset|angry|complain|refund|comp|apolog|mad|disappoint|rushed)\b/i,
  promo: /\b(promo|campaign|deal|offer|post|market|weekend|special|discount)\b/i,
  review: /\b(review|reputation|rating|stars?|google|yelp)\b/i,
};

export function detectIntent(message: string): DetectedGoal {
  const m = message.toLowerCase();
  const capMatch = m.match(/(\d{1,2})\s?%/);
  const discountCapPct = capMatch ? parseInt(capMatch[1], 10) : undefined;

  const constraints: string[] = [];
  if (discountCapPct !== undefined)
    constraints.push(`Discounts ≤ ${discountCapPct}% without approval`);
  if (/\b(classy|not desperate|don'?t sound desperate|premium|tasteful)\b/i.test(message))
    constraints.push("Warm, premium tone — never desperate");
  if (/\b(approv|check with me|ask me|before.*send)\b/i.test(message))
    constraints.push("Owner approves outbound before it sends");

  let intent: Intent = "general";
  if (RX.unhappy.test(m)) intent = "recover_customer";
  else if (RX.slow.test(m)) intent = "fill_capacity";
  else if (RX.review.test(m)) intent = "reputation";
  else if (RX.promo.test(m)) intent = "run_promo";

  const goals: Record<Intent, string> = {
    fill_capacity: "Fill open capacity with the right outreach, on-brand.",
    recover_customer: "Make an unhappy customer whole and keep them loyal.",
    run_promo: "Run a promotion that adds bookings without eroding margin.",
    reputation: "Strengthen public reputation and handle feedback with care.",
    general: "Understand the request and get it done within your guardrails.",
  };

  return { intent, goal: goals[intent], constraints, discountCapPct };
}

// --- step templates (worker + objective per step) ---------------------------

interface StepTemplate {
  worker: WorkerType;
  title: string;
  detail: string;
  objective: Objective;
  requiresApproval: boolean;
  risk: RiskLevel;
}

const TEMPLATES: Record<Intent, StepTemplate[]> = {
  fill_capacity: [
    { worker: "scheduling", title: "Map open slots", detail: "Pull the calendar and find every fillable opening.", objective: "fast_cheap", requiresApproval: false, risk: "low" },
    { worker: "cfo", title: "Pick who to reach", detail: "Segment inactive, high-fit customers worth re-engaging.", objective: "deep_reasoning", requiresApproval: false, risk: "low" },
    { worker: "sales_followup", title: "Draft the outreach", detail: "Write a warm, on-brand message within the discount limit.", objective: "on_brand_writing", requiresApproval: true, risk: "medium" },
    { worker: "front_desk", title: "Handle replies & book", detail: "Answer responses and write confirmed times into the calendar.", objective: "fast_cheap", requiresApproval: false, risk: "low" },
    { worker: "cfo", title: "Report the result", detail: "Bookings recovered, revenue added, discount cost.", objective: "fast_cheap", requiresApproval: false, risk: "low" },
  ],
  recover_customer: [
    { worker: "support", title: "Understand what happened", detail: "Review the history and the customer's value.", objective: "deep_reasoning", requiresApproval: false, risk: "low" },
    { worker: "reputation", title: "Draft a personal apology", detail: "Sincere, in your voice — not a template.", objective: "on_brand_writing", requiresApproval: true, risk: "high" },
    { worker: "cfo", title: "Set up the goodwill offer", detail: "Load the agreed comp and keep it off public channels.", objective: "fast_cheap", requiresApproval: false, risk: "medium" },
  ],
  run_promo: [
    { worker: "cfo", title: "Model the economics", detail: "Project bookings vs. discount cost before anything runs.", objective: "deep_reasoning", requiresApproval: false, risk: "low" },
    { worker: "marketing", title: "Draft the campaign", detail: "On-brand creative and copy for the offer.", objective: "on_brand_writing", requiresApproval: true, risk: "medium" },
    { worker: "marketing", title: "Schedule & launch", detail: "Queue it across the right channels at the right time.", objective: "fast_cheap", requiresApproval: false, risk: "low" },
  ],
  reputation: [
    { worker: "reputation", title: "Triage feedback", detail: "Sort happy vs. unhappy and flag anything sensitive.", objective: "fast_cheap", requiresApproval: false, risk: "low" },
    { worker: "reputation", title: "Draft replies", detail: "Public-ready responses that protect the brand.", objective: "on_brand_writing", requiresApproval: true, risk: "high" },
  ],
  general: [
    { worker: "operations", title: "Break down the request", detail: "Turn the ask into concrete, ordered steps.", objective: "deep_reasoning", requiresApproval: false, risk: "low" },
    { worker: "operations", title: "Do the work", detail: "Execute within your guardrails.", objective: "balanced", requiresApproval: false, risk: "low" },
    { worker: "support", title: "Summarize back", detail: "What got done and what (if anything) needs you.", objective: "fast_cheap", requiresApproval: false, risk: "low" },
  ],
};

// --- the planner ------------------------------------------------------------

export function buildPlan(message: string): BossmanPlan {
  const detected = detectIntent(message);
  const templates = TEMPLATES[detected.intent];

  const steps: PlannedStep[] = templates.map((t) => {
    const decision = route({ objective: t.objective });
    const topFactors = decision.ranked[0].rationale
      .filter((r) => r.factor !== "recency" && r.contribution > 0.001)
      .slice(0, 2)
      .map((r) => r.factor.replace(/_/g, " "))
      .join(" + ");
    return {
      worker: t.worker,
      title: t.title,
      detail: t.detail,
      objective: t.objective,
      model: decision.chosen.label,
      modelId: decision.chosen.id,
      rationale: `best on ${topFactors}`,
      requiresApproval: t.requiresApproval,
      risk: t.risk,
    };
  });

  return {
    message,
    intent: detected.intent,
    goal: detected.goal,
    constraints: detected.constraints,
    steps,
  };
}
