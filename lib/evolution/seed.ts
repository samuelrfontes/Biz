import { WorkerType } from "../types";
import { AgentBrain, FeedbackEvent, replay } from "./evolution";

// Seeded feedback histories for the active workspace's agents. In production
// these are real FeedbackEvents accumulated from owner actions; here they let
// the Evolution screen show genuinely different, computed brain states.

function reps(kind: FeedbackEvent["kind"], worker: WorkerType, modelId: string, n: number): FeedbackEvent[] {
  return Array.from({ length: n }, () => ({ worker, kind, modelId }));
}

const histories: Record<string, FeedbackEvent[]> = {
  front_desk: [
    ...reps("approved", "front_desk", "gpt-4o-mini", 34),
    ...reps("outcome_good", "front_desk", "gpt-4o-mini", 22),
    ...reps("edited", "front_desk", "gpt-4o-mini", 4),
    {
      worker: "front_desk",
      kind: "explicit",
      note: "Always offer the next two open times, not a vague 'when works?'",
      toneSignal: { warmth: 0.6, brevity: 0.4 },
    },
    {
      worker: "front_desk",
      kind: "explicit",
      note: "Call the studio 'the girls' — owner's phrasing with regulars.",
      toneSignal: { warmth: 0.7, formality: -0.5, playfulness: 0.3 },
    },
  ],
  sales_followup: [
    ...reps("approved", "sales_followup", "claude-opus-4-8", 11),
    ...reps("edited", "sales_followup", "claude-opus-4-8", 6),
    ...reps("outcome_good", "sales_followup", "claude-opus-4-8", 9),
    ...reps("declined", "sales_followup", "claude-haiku-4-5", 3),
    {
      worker: "sales_followup",
      kind: "explicit",
      note: "Never use the word 'deal' — say 'treat yourself'.",
      toneSignal: { warmth: 0.8, assertiveness: -0.3 },
    },
    {
      worker: "sales_followup",
      kind: "edited",
      note: "Owner shortens openers — drop the 'Hope you're well!' line.",
      toneSignal: { brevity: 0.6 },
    },
  ],
  reputation: [
    ...reps("approved", "reputation", "claude-sonnet-4-6", 5),
    ...reps("edited", "reputation", "claude-sonnet-4-6", 3),
    {
      worker: "reputation",
      kind: "explicit",
      note: "Sign review replies from 'Mai', the owner, personally.",
      toneSignal: { warmth: 0.6, formality: 0.2 },
    },
  ],
  scheduling: [
    ...reps("approved", "scheduling", "gpt-4o", 28),
    ...reps("outcome_good", "scheduling", "gpt-4o", 19),
    {
      worker: "scheduling",
      kind: "explicit",
      note: "Lena: no weekday bookings after 5pm (childcare).",
    },
  ],
  cfo: [...reps("approved", "cfo", "o3", 6), ...reps("outcome_good", "cfo", "o3", 4)],
  marketing: [
    ...reps("approved", "marketing", "claude-opus-4-8", 2),
    ...reps("edited", "marketing", "claude-opus-4-8", 2),
  ],
};

export function evolvedBrains(workers: WorkerType[]): AgentBrain[] {
  return workers.map((w) => replay(w, histories[w] ?? []));
}
