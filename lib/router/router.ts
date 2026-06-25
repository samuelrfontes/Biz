import { MODEL_REGISTRY, OBJECTIVES } from "./models";
import {
  Capability,
  ModelProfile,
  RouteDecision,
  ScoredModel,
  TaskSpec,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────
// THE ROUTER
//
// route(spec) -> the best model for a task, a ranked shortlist, fallbacks, and
// a human-readable explanation. Pure function: deterministic, testable, and
// completely decoupled from which models happen to exist today.
//
// Design goals:
//  • The user never names a model. They give an Objective (or just talk, and
//    Bossman infers it). The router does the rest.
//  • New models are picked up automatically — nothing here references a model
//    by name. The best model wins on merit.
//  • Recency tie-break: when two models are close, prefer the newer one, so
//    "latest & greatest" is the default without manual promotion.
// ─────────────────────────────────────────────────────────────────────────

const RECENCY_WEIGHT = 0.06; // small nudge toward newer models on close calls
const STATUS_PENALTY = { ga: 0, preview: 0.04, deprecated: 1 } as const;

function capScore(model: ModelProfile, cap: Capability): number {
  return model.caps[cap] ?? 0;
}

/** Merge objective default weights with any per-task overrides. */
function resolveWeights(spec: TaskSpec): Partial<Record<Capability, number>> {
  const base = OBJECTIVES[spec.objective].weights;
  return { ...base, ...(spec.weights ?? {}) };
}

function recencyBonus(model: ModelProfile, now: number): number {
  const ageDays = (now - new Date(model.releasedAt).getTime()) / 86_400_000;
  // newest (~0 days) -> ~1, a year old -> ~0
  return Math.max(0, 1 - ageDays / 365);
}

function meetsHardRequirements(model: ModelProfile, spec: TaskSpec): boolean {
  const obj = OBJECTIVES[spec.objective];
  if (model.status === "deprecated") return false;
  if (spec.allowPreview === false && model.status === "preview") return false;
  if (spec.excludeProviders?.includes(model.provider)) return false;

  const reqMods = [...(obj.requiredModalities ?? []), ...(spec.requiredModalities ?? [])];
  if (reqMods.some((m) => !model.modalities.includes(m))) return false;

  const reqCaps = [...(obj.requiredCapabilities ?? []), ...(spec.requiredCapabilities ?? [])];
  if (reqCaps.some((c) => capScore(model, c) <= 0)) return false;

  const minCtx = Math.max(obj.minContextTokens ?? 0, spec.minContextTokens ?? 0);
  if (model.contextTokens < minCtx) return false;

  if (spec.maxRelCost !== undefined && (model.relCostPerMTokOut ?? 1) < spec.maxRelCost) {
    // relCost: higher = cheaper. maxRelCost is a floor on cheapness.
    return false;
  }
  return true;
}

function scoreModel(model: ModelProfile, spec: TaskSpec, now: number): ScoredModel {
  const weights = resolveWeights(spec);
  const entries = Object.entries(weights) as [Capability, number][];
  const totalWeight = entries.reduce((s, [, w]) => s + Math.abs(w), 0) || 1;

  const rationale: { factor: string; contribution: number }[] = [];
  let weighted = 0;
  for (const [cap, w] of entries) {
    const contribution = (capScore(model, cap) * w) / totalWeight;
    weighted += contribution;
    rationale.push({ factor: cap, contribution });
  }

  // small modifiers
  const recency = recencyBonus(model, now) * RECENCY_WEIGHT;
  weighted += recency;
  rationale.push({ factor: "recency", contribution: recency });
  weighted -= STATUS_PENALTY[model.status];

  rationale.sort((a, b) => b.contribution - a.contribution);
  return { model, score: Math.max(0, Math.min(1, weighted)), rationale: rationale.slice(0, 4) };
}

export function route(
  spec: TaskSpec,
  registry: ModelProfile[] = MODEL_REGISTRY,
  now: number = Date.now(),
): RouteDecision {
  // Hard pin (tenant override / compliance) short-circuits selection.
  if (spec.pinModelId) {
    const pinned = registry.find((m) => m.id === spec.pinModelId);
    if (pinned) {
      const scored = scoreModel(pinned, spec, now);
      return {
        spec,
        chosen: pinned,
        ranked: [scored],
        fallbacks: [],
        explanation: `Pinned to ${pinned.label} by policy.`,
      };
    }
  }

  const eligible = registry.filter((m) => meetsHardRequirements(m, spec));
  if (eligible.length === 0) {
    throw new Error(
      `No model in the registry satisfies objective "${spec.objective}" with the given requirements.`,
    );
  }

  const ranked = eligible
    .map((m) => scoreModel(m, spec, now))
    .sort((a, b) => b.score - a.score);

  const chosen = ranked[0].model;
  const fallbacks = ranked.slice(1, 4).map((r) => r.model);
  const top = ranked[0].rationale
    .filter((r) => r.factor !== "recency")
    .slice(0, 2)
    .map((r) => r.factor)
    .join(" + ");

  return {
    spec,
    chosen,
    ranked,
    fallbacks,
    explanation: `${chosen.label} — best on ${top} for "${OBJECTIVES[spec.objective].label}". Falls back to ${fallbacks[0]?.label ?? "n/a"}.`,
  };
}

/** Convenience: route straight from an objective with optional nudges. */
export function routeFor(
  objective: TaskSpec["objective"],
  overrides: Partial<TaskSpec> = {},
): RouteDecision {
  return route({ objective, ...overrides });
}
