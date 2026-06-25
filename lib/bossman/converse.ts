import { WORKER_META } from "../types";
import { OBJECTIVES } from "../router/models";
import { completeJSON, isLLMEnabled } from "./llm";
import {
  PlannedStep,
  StepTemplate,
  coerceStep,
  routeStep,
  detectIntent,
  buildPlanHeuristic,
} from "./planner";

// ─────────────────────────────────────────────────────────────────────────
// CONVERSE — the live conversational brain behind the Bossman console.
//
// Given whatever the owner actually typed, produce everything the console
// needs to play a real conversation-to-action sequence: a natural reply, an
// optional clarifying question, the plan (goal + constraints + routed steps),
// the approval gate, and the report-back. One Claude call when a key is set;
// a graceful heuristic otherwise. The router still chooses every model.
// ─────────────────────────────────────────────────────────────────────────

export interface ConverseApproval {
  title: string;
  preview: string;
  reason: string;
}

export interface ConverseResult {
  reply: string;
  clarifyingQuestion: string | null;
  quickReplies: string[];
  goal: string;
  constraints: string[];
  steps: PlannedStep[];
  approval: ConverseApproval | null;
  report: string[];
  poweredBy: "claude" | "heuristic";
}

// --- heuristic fallback (no key) -------------------------------------------

function heuristicConverse(message: string): ConverseResult {
  const plan = buildPlanHeuristic(message);
  const detected = detectIntent(message);

  const replies: Record<string, string> = {
    fill_capacity:
      "Got it. I'll check your openings, find the right inactive customers, and draft outreach within your limits before anything goes out.",
    recover_customer:
      "I hear you. I'll look at what happened, draft a sincere note in your voice, and set up a goodwill gesture — nothing public.",
    run_promo:
      "Love it. I'll model the numbers first so we don't lose margin, then draft the campaign for your sign-off.",
    reputation:
      "On it. I'll triage the feedback, protect your brand, and draft replies for anything sensitive before posting.",
    general:
      "Got it. I'll break this down, handle what I safely can, and bring you anything that needs a real decision.",
  };

  const gatedStep = plan.steps.find((s) => s.requiresApproval);
  const approval: ConverseApproval | null = gatedStep
    ? {
        title: `${gatedStep.title} — your approval?`,
        preview:
          "Here's the draft I'd send. Reply to approve, or tell me what to change.",
        reason: "This one spends money, posts publicly, or messages customers — so it's yours to approve.",
      }
    : null;

  return {
    reply: replies[detected.intent] ?? replies.general,
    clarifyingQuestion: "Want me to go ahead, or adjust anything first?",
    quickReplies: ["Go ahead", "Tweak it first"],
    goal: plan.goal,
    constraints: plan.constraints.length ? plan.constraints : ["Stay within your guardrails"],
    steps: plan.steps,
    approval,
    report: [
      "Plan ready and your workforce is lined up",
      "I'll handle the routine parts and report back",
      "You'll only hear from me when it matters",
    ],
    poweredBy: "heuristic",
  };
}

// --- live brain (with key) -------------------------------------------------

interface RawConverse {
  reply?: string;
  clarifyingQuestion?: string | null;
  quickReplies?: string[];
  goal?: string;
  constraints?: string[];
  steps?: any[];
  approval?: { title?: string; preview?: string; reason?: string } | null;
  report?: string[];
}

export async function converse(message: string): Promise<ConverseResult> {
  if (!isLLMEnabled()) return heuristicConverse(message);

  const workerList = Object.entries(WORKER_META)
    .map(([k, v]) => `${k} (${v.title})`)
    .join(", ");
  const objectiveList = Object.keys(OBJECTIVES).join(", ");

  const raw = await completeJSON<RawConverse>({
    system:
      "You are Bossman — an AI operator a small-business owner talks to like a real, sharp human manager. You understand the goal, make a plan, delegate to specialized AI worker agents, and gate risky actions for approval. Warm, confident, concise. Never robotic. You work for ANY kind of business; adapt to whatever they describe.",
    user: `The owner just said: "${message}"

Respond as Bossman with a JSON object:
{
  "reply": "1-2 sentences, natural and specific to what they said — like a great operator who just got it",
  "clarifyingQuestion": "one genuinely useful question, or null if none needed",
  "quickReplies": ["2-3 short tappable answers to that question", "..."],
  "goal": "one sentence: what success looks like",
  "constraints": ["any limits/rules they stated (budgets, tone, approvals)"],
  "steps": [
    {
      "worker": "one of: ${workerList}",
      "title": "short imperative",
      "detail": "one sentence on what this step does",
      "objective": "one of: ${objectiveList}",
      "requiresApproval": true/false (true if it spends money, posts publicly, mass-messages, or touches an unhappy customer),
      "risk": "low|medium|high"
    }
  ],
  "approval": { "title": "what needs your OK", "preview": "the EXACT message or action text you'd send", "reason": "why it needs approval" } OR null,
  "report": ["3-4 short bullet lines of what got done / results, as if reporting back later"]
}
Pick 2-5 steps. Make it specific to their actual request and business. Output ONLY the JSON.`,
    maxTokens: 1500,
  });

  if (!raw) return heuristicConverse(message);

  const steps: PlannedStep[] = (raw.steps ?? [])
    .map(coerceStep)
    .filter((s): s is StepTemplate => s !== null)
    .map(routeStep);

  if (steps.length === 0) return heuristicConverse(message);

  // If the model flagged a step but gave no approval block, synthesize one.
  let approval: ConverseApproval | null = null;
  if (raw.approval && raw.approval.preview) {
    approval = {
      title: String(raw.approval.title ?? "Needs your approval"),
      preview: String(raw.approval.preview),
      reason: String(raw.approval.reason ?? "This action is gated by your guardrails."),
    };
  } else {
    const gated = steps.find((s) => s.requiresApproval);
    if (gated)
      approval = {
        title: `${gated.title} — your approval?`,
        preview: "Here's what I'd do. Approve, or tell me what to change.",
        reason: "Gated by your guardrails (money, public, mass message, or sensitive customer).",
      };
  }

  const clean = (s: unknown, max = 240) => String(s ?? "").slice(0, max);
  return {
    reply: clean(raw.reply) || heuristicConverse(message).reply,
    clarifyingQuestion: raw.clarifyingQuestion ? clean(raw.clarifyingQuestion) : null,
    quickReplies: Array.isArray(raw.quickReplies)
      ? raw.quickReplies.map((q) => clean(q, 40)).slice(0, 3)
      : [],
    goal: clean(raw.goal) || "Get this done within your guardrails.",
    constraints: Array.isArray(raw.constraints)
      ? raw.constraints.map((c) => clean(c, 80)).slice(0, 5)
      : [],
    steps,
    approval,
    report: Array.isArray(raw.report) ? raw.report.map((r) => clean(r, 120)).slice(0, 5) : [],
    poweredBy: "claude",
  };
}
