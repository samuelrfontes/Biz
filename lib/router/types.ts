// ─────────────────────────────────────────────────────────────────────────
// Bossman Model Router — type system
//
// This is the engine that lets the user NEVER pick a model. They describe a
// task (or just talk); Bossman turns it into a TaskSpec and the router scores
// every model in the registry against it and picks the best one — with a
// rationale and a fallback chain.
//
// Adding a new LLM the day it ships = adding one ModelProfile to the registry
// (see models.ts) or letting sync.ts ingest it. Zero changes to this file.
// ─────────────────────────────────────────────────────────────────────────

/** The capability axes a model can be strong/weak on. Add axes as the field
 *  evolves; models default to 0 on any axis they don't declare. */
export type Capability =
  | "reasoning" // hard multi-step thinking, planning
  | "coding"
  | "writing" // on-brand, persuasive natural language
  | "math"
  | "vision" // image understanding
  | "voice_realtime" // low-latency speech in/out
  | "tool_use" // reliable function/tool calling
  | "long_context" // large documents / memory
  | "speed" // tokens/sec + low latency
  | "cost" // cost efficiency (higher = cheaper)
  | "creativity"
  | "multilingual"
  | "safety"; // refusal calibration / sensitive content handling

export type Modality = "text" | "image_in" | "audio_in" | "audio_out" | "image_out";

export type ModelStatus = "ga" | "preview" | "deprecated";

/** A single model in the registry. Pure data — this is what you add when a new
 *  model is released. Capability scores are normalized 0..1 (relative quality
 *  on that axis), so the registry stays provider-neutral and easy to extend. */
export interface ModelProfile {
  id: string; // canonical id, e.g. "claude-opus-4-8"
  label: string; // display name
  provider: "anthropic" | "openai" | "google" | "meta" | "mistral" | "xai" | string;
  status: ModelStatus;
  releasedAt: string; // ISO date — used to prefer the latest
  contextTokens: number;
  modalities: Modality[];
  /** Relative price signal, normalized: 0 = most expensive, 1 = cheapest.
   *  The router reads `caps.cost`; this raw figure is for display only. */
  relCostPerMTokOut?: number;
  /** Capability scores, 0..1. Omitted axes are treated as 0. */
  caps: Partial<Record<Capability, number>>;
  /** Optional notes shown in the UI / audit ("why this model exists"). */
  note?: string;
  /** Where this entry came from — manual seed or auto-sync feed. */
  source?: "seed" | "sync";
}

/** High-level intent presets. A caller (or Bossman's planner) usually just
 *  names an objective; the router knows the weight profile + hard requirements
 *  each objective implies. This is the layer that means "give a task, not a
 *  model". */
export type Objective =
  | "deep_reasoning"
  | "fast_cheap"
  | "on_brand_writing"
  | "realtime_voice"
  | "vision"
  | "coding"
  | "long_document"
  | "balanced";

/** A concrete routing request. Built from an Objective, but every field can be
 *  overridden per-task (and per-tenant policy can clamp it). */
export interface TaskSpec {
  objective: Objective;
  /** Hard requirements — a model is excluded if it can't meet these. */
  requiredModalities?: Modality[];
  requiredCapabilities?: Capability[]; // must score > 0 on each
  minContextTokens?: number;
  /** Soft priorities, 0..1 weights over capability axes. Merged over the
   *  objective's defaults so callers can nudge (e.g. "cheaper, please"). */
  weights?: Partial<Record<Capability, number>>;
  /** Tenant/budget guardrails. */
  maxRelCost?: number; // exclude models more expensive than this (0..1, lower=pricier)
  allowPreview?: boolean; // default true — bleeding edge allowed
  /** Pin/avoid (tenant overrides, compliance, etc.). */
  pinModelId?: string;
  excludeProviders?: string[];
}

export interface ScoredModel {
  model: ModelProfile;
  score: number; // 0..1 final
  /** Top reasons this model scored where it did, for the audit/UI. */
  rationale: { factor: string; contribution: number }[];
}

export interface RouteDecision {
  spec: TaskSpec;
  chosen: ModelProfile;
  /** Full ranking (chosen first), so the UI can show the shortlist. */
  ranked: ScoredModel[];
  /** Ordered fallbacks if the chosen model errors/times out. */
  fallbacks: ModelProfile[];
  /** One-line human explanation, e.g. for the audit trail. */
  explanation: string;
}
