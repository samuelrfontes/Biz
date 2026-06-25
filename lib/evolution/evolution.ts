import { WorkerType } from "../types";

// ─────────────────────────────────────────────────────────────────────────
// SELF-EVOLVING AGENTS
//
// Bossman's workers are not static. Each one keeps an AgentBrain per tenant
// that learns from feedback: which model serves this owner best, how the owner
// likes things phrased, which approaches get approved vs edited vs declined.
//
// Every owner action is a FeedbackEvent. applyFeedback() updates the brain.
// Over weeks, an owner's Sales agent writes more like them, routes to the model
// that actually lands bookings for *their* customers, and needs fewer
// approvals because it has internalized their guardrails. The product gets more
// valuable the longer you use it — and no two tenants' agents end up the same.
// ─────────────────────────────────────────────────────────────────────────

export type FeedbackKind =
  | "approved" // owner approved as-is  -> reinforce
  | "edited" // owner tweaked before approving -> learn the edit
  | "declined" // owner rejected -> penalize approach
  | "outcome_good" // downstream success (customer booked/paid/replied)
  | "outcome_bad"
  | "explicit"; // owner stated a preference in conversation

export interface FeedbackEvent {
  worker: WorkerType;
  kind: FeedbackKind;
  /** Which model produced the work, so we can update model affinity. */
  modelId?: string;
  /** Free-text signal (an owner edit, a stated rule) for the learned-prefs log. */
  note?: string;
  /** Tone dimensions inferred from the interaction, -1..1. */
  toneSignal?: Partial<ToneVector>;
  at?: string;
}

/** A few interpretable tone dials the agent calibrates per owner. */
export interface ToneVector {
  warmth: number; // -1 clinical … +1 warm
  formality: number; // -1 casual … +1 formal
  brevity: number; // -1 detailed … +1 terse
  assertiveness: number; // -1 soft … +1 direct
  playfulness: number; // -1 serious … +1 playful
}

export interface AgentBrain {
  worker: WorkerType;
  /** Confidence/competence at this tenant's work, 0..1. Drives how much
   *  autonomy Bossman grants before requiring approval. */
  proficiency: number;
  /** Per-model affinity for THIS tenant's tasks, 0..1 (seeds the router's
   *  weights with hard-won, tenant-specific evidence). */
  modelAffinity: Record<string, number>;
  tone: ToneVector;
  /** Human-readable things the agent has learned — shown in the UI. */
  learnedPreferences: string[];
  stats: { approved: number; edited: number; declined: number; runs: number };
  /** 0..1 — how much it has personalized to this owner. */
  evolutionLevel: number;
}

export function newBrain(worker: WorkerType): AgentBrain {
  return {
    worker,
    proficiency: 0.5,
    modelAffinity: {},
    tone: { warmth: 0.3, formality: 0, brevity: 0, assertiveness: 0, playfulness: 0 },
    learnedPreferences: [],
    stats: { approved: 0, edited: 0, declined: 0, runs: 0 },
    evolutionLevel: 0,
  };
}

const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const clamp1 = (n: number) => clamp(n, -1, 1);

const PROFICIENCY_DELTA: Record<FeedbackKind, number> = {
  approved: +0.03,
  edited: +0.005, // still useful, but it wasn't right the first time
  declined: -0.05,
  outcome_good: +0.04,
  outcome_bad: -0.04,
  explicit: 0,
};

const AFFINITY_DELTA: Record<FeedbackKind, number> = {
  approved: +0.05,
  edited: -0.01,
  declined: -0.06,
  outcome_good: +0.07,
  outcome_bad: -0.07,
  explicit: 0,
};

/** Apply one feedback event to a brain, returning the updated brain (pure). */
export function applyFeedback(brain: AgentBrain, ev: FeedbackEvent, lr = 0.25): AgentBrain {
  const stats = { ...brain.stats, runs: brain.stats.runs + 1 };
  if (ev.kind === "approved") stats.approved++;
  if (ev.kind === "edited") stats.edited++;
  if (ev.kind === "declined") stats.declined++;

  const proficiency = clamp(brain.proficiency + PROFICIENCY_DELTA[ev.kind]);

  const modelAffinity = { ...brain.modelAffinity };
  if (ev.modelId) {
    const cur = modelAffinity[ev.modelId] ?? 0.5;
    modelAffinity[ev.modelId] = clamp(cur + AFFINITY_DELTA[ev.kind]);
  }

  // EMA the tone vector toward observed signals.
  const tone = { ...brain.tone };
  if (ev.toneSignal) {
    for (const k of Object.keys(ev.toneSignal) as (keyof ToneVector)[]) {
      const target = ev.toneSignal[k]!;
      tone[k] = clamp1(tone[k] + lr * (target - tone[k]));
    }
  }

  const learnedPreferences = ev.note
    ? [ev.note, ...brain.learnedPreferences].slice(0, 8)
    : brain.learnedPreferences;

  // Evolution level: a blend of how much signal we've absorbed and how
  // reliably the agent now lands work without edits.
  const reliability =
    stats.runs > 0 ? (stats.approved + 0.4 * stats.edited) / stats.runs : 0;
  const evolutionLevel = clamp(0.6 * Math.min(1, stats.runs / 40) + 0.4 * reliability);

  return {
    ...brain,
    proficiency,
    modelAffinity,
    tone,
    learnedPreferences,
    stats,
    evolutionLevel,
  };
}

/** Fold a whole history of feedback into a brain (e.g. on load). */
export function replay(worker: WorkerType, events: FeedbackEvent[]): AgentBrain {
  return events.reduce(applyFeedback, newBrain(worker));
}

/** Does this brain warrant more autonomy? Bossman uses this to relax approval
 *  gates as an agent proves itself for a given tenant (never for high-risk). */
export function autonomyTier(brain: AgentBrain): "training" | "trusted" | "autopilot" {
  if (brain.proficiency >= 0.8 && brain.evolutionLevel >= 0.7) return "autopilot";
  if (brain.proficiency >= 0.62) return "trusted";
  return "training";
}

export function describeTone(t: ToneVector): string {
  const parts: string[] = [];
  if (t.warmth > 0.25) parts.push("warm");
  else if (t.warmth < -0.25) parts.push("clinical");
  if (t.formality > 0.3) parts.push("formal");
  else if (t.formality < -0.3) parts.push("casual");
  if (t.brevity > 0.3) parts.push("concise");
  if (t.assertiveness > 0.3) parts.push("direct");
  if (t.playfulness > 0.3) parts.push("playful");
  return parts.length ? parts.join(", ") : "balanced";
}
