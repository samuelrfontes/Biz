import { ModelProfile, Objective, Capability } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// THE MODEL REGISTRY
//
// This is the ONLY thing you touch when a new LLM ships: add a ModelProfile.
// Everything downstream (routing, UI, audit) updates automatically. In
// production this array is hydrated from the `model_profile` table, which
// sync.ts keeps current by polling provider catalogs (see sync.ts).
//
// Capability scores are normalized 0..1 (relative quality on that axis). They
// are intentionally provider-neutral and easy to tune — the router only ever
// reasons about capabilities, never hard-codes a model name.
// ─────────────────────────────────────────────────────────────────────────

export const MODEL_REGISTRY: ModelProfile[] = [
  {
    id: "claude-opus-4-8",
    label: "Claude Opus 4.8",
    provider: "anthropic",
    status: "ga",
    releasedAt: "2026-05-01",
    contextTokens: 500_000,
    modalities: ["text", "image_in"],
    relCostPerMTokOut: 0.2,
    caps: {
      reasoning: 0.99, writing: 0.97, coding: 0.95, tool_use: 0.95,
      long_context: 0.92, vision: 0.85, math: 0.9, creativity: 0.93,
      safety: 0.95, multilingual: 0.88, speed: 0.55, cost: 0.35,
    },
    note: "Top-tier reasoning, planning, and on-brand writing.",
    source: "seed",
  },
  {
    id: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    provider: "anthropic",
    status: "ga",
    releasedAt: "2026-04-10",
    contextTokens: 400_000,
    modalities: ["text", "image_in"],
    relCostPerMTokOut: 0.55,
    caps: {
      reasoning: 0.9, writing: 0.92, coding: 0.9, tool_use: 0.92,
      long_context: 0.9, vision: 0.82, math: 0.82, creativity: 0.88,
      safety: 0.94, multilingual: 0.86, speed: 0.78, cost: 0.62,
    },
    note: "The workhorse — near-Opus quality, much faster and cheaper.",
    source: "seed",
  },
  {
    id: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    provider: "anthropic",
    status: "ga",
    releasedAt: "2025-10-01",
    contextTokens: 250_000,
    modalities: ["text", "image_in"],
    relCostPerMTokOut: 0.9,
    caps: {
      reasoning: 0.74, writing: 0.8, coding: 0.78, tool_use: 0.85,
      long_context: 0.78, vision: 0.7, math: 0.66, creativity: 0.72,
      safety: 0.9, multilingual: 0.8, speed: 0.95, cost: 0.92,
    },
    note: "Fast, cheap, dependable for high-volume tasks.",
    source: "seed",
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    status: "ga",
    releasedAt: "2025-08-15",
    contextTokens: 128_000,
    modalities: ["text", "image_in", "audio_in", "audio_out"],
    relCostPerMTokOut: 0.5,
    caps: {
      reasoning: 0.86, writing: 0.86, coding: 0.86, tool_use: 0.9,
      long_context: 0.74, vision: 0.88, voice_realtime: 0.9, math: 0.8,
      creativity: 0.85, safety: 0.85, multilingual: 0.9, speed: 0.8, cost: 0.6,
    },
    note: "Strong multimodal + native realtime voice.",
    source: "seed",
  },
  {
    id: "gpt-4o-mini",
    label: "GPT-4o mini",
    provider: "openai",
    status: "ga",
    releasedAt: "2025-08-15",
    contextTokens: 128_000,
    modalities: ["text", "image_in", "audio_in", "audio_out"],
    relCostPerMTokOut: 0.95,
    caps: {
      reasoning: 0.7, writing: 0.76, coding: 0.76, tool_use: 0.84,
      long_context: 0.7, vision: 0.78, voice_realtime: 0.88, math: 0.66,
      creativity: 0.7, safety: 0.82, multilingual: 0.86, speed: 0.94, cost: 0.95,
    },
    note: "Cheap realtime voice + high-volume front-desk work.",
    source: "seed",
  },
  {
    id: "o3",
    label: "OpenAI o3",
    provider: "openai",
    status: "ga",
    releasedAt: "2025-12-01",
    contextTokens: 200_000,
    modalities: ["text", "image_in"],
    relCostPerMTokOut: 0.25,
    caps: {
      reasoning: 0.97, coding: 0.94, math: 0.96, tool_use: 0.88,
      long_context: 0.82, vision: 0.8, writing: 0.84, creativity: 0.8,
      safety: 0.86, multilingual: 0.84, speed: 0.45, cost: 0.4,
    },
    note: "Deliberate reasoning specialist for math/analysis.",
    source: "seed",
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    provider: "google",
    status: "ga",
    releasedAt: "2026-03-01",
    contextTokens: 2_000_000,
    modalities: ["text", "image_in", "audio_in"],
    relCostPerMTokOut: 0.5,
    caps: {
      reasoning: 0.9, writing: 0.86, coding: 0.9, tool_use: 0.88,
      long_context: 0.99, vision: 0.9, math: 0.88, creativity: 0.85,
      safety: 0.85, multilingual: 0.92, speed: 0.7, cost: 0.6,
    },
    note: "Enormous context window — best for long documents.",
    source: "seed",
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "google",
    status: "ga",
    releasedAt: "2026-03-01",
    contextTokens: 1_000_000,
    modalities: ["text", "image_in", "audio_in"],
    relCostPerMTokOut: 0.93,
    caps: {
      reasoning: 0.76, writing: 0.78, coding: 0.8, tool_use: 0.84,
      long_context: 0.95, vision: 0.84, math: 0.72, creativity: 0.74,
      safety: 0.82, multilingual: 0.9, speed: 0.93, cost: 0.93,
    },
    note: "Fast + huge context at low cost.",
    source: "seed",
  },
];

// ─────────────────────────────────────────────────────────────────────────
// OBJECTIVE PROFILES
// Each objective = the capability weights + hard requirements it implies.
// This is what lets a caller say "draft on-brand copy" instead of naming a
// model. New objectives are cheap to add.
// ─────────────────────────────────────────────────────────────────────────

export interface ObjectiveProfile {
  label: string;
  description: string;
  weights: Partial<Record<Capability, number>>;
  requiredCapabilities?: Capability[];
  requiredModalities?: ModelProfile["modalities"];
  minContextTokens?: number;
}

export const OBJECTIVES: Record<Objective, ObjectiveProfile> = {
  deep_reasoning: {
    label: "Deep reasoning & planning",
    description: "Multi-step thinking, strategy, judgment calls.",
    weights: { reasoning: 1, tool_use: 0.5, writing: 0.3, speed: 0.15, cost: 0.15 },
    requiredCapabilities: ["reasoning"],
  },
  on_brand_writing: {
    label: "On-brand writing",
    description: "Customer-facing copy that sounds like the business.",
    weights: { writing: 1, creativity: 0.6, reasoning: 0.4, safety: 0.4, speed: 0.2, cost: 0.25 },
    requiredCapabilities: ["writing"],
  },
  fast_cheap: {
    label: "Fast & cheap, high volume",
    description: "Routine high-throughput tasks where latency & cost win.",
    weights: { speed: 1, cost: 1, tool_use: 0.5, reasoning: 0.3 },
  },
  realtime_voice: {
    label: "Realtime voice",
    description: "Live phone conversations — must be low-latency speech.",
    weights: { voice_realtime: 1, speed: 0.8, tool_use: 0.5, cost: 0.4 },
    requiredCapabilities: ["voice_realtime"],
    requiredModalities: ["audio_in", "audio_out"],
  },
  vision: {
    label: "Vision / image understanding",
    description: "Reading photos, receipts, IDs, screenshots.",
    weights: { vision: 1, reasoning: 0.5, cost: 0.3, speed: 0.3 },
    requiredCapabilities: ["vision"],
    requiredModalities: ["image_in"],
  },
  coding: {
    label: "Coding & automation",
    description: "Writing code, scripts, structured tool calls.",
    weights: { coding: 1, reasoning: 0.7, tool_use: 0.7, speed: 0.25, cost: 0.2 },
    requiredCapabilities: ["coding"],
  },
  long_document: {
    label: "Long-document analysis",
    description: "Contracts, transcripts, big knowledge bases.",
    weights: { long_context: 1, reasoning: 0.7, cost: 0.3, speed: 0.2 },
    requiredCapabilities: ["long_context"],
    minContextTokens: 400_000,
  },
  balanced: {
    label: "Balanced",
    description: "A sensible default across quality, speed, and cost.",
    weights: { reasoning: 0.7, writing: 0.6, tool_use: 0.6, speed: 0.6, cost: 0.6 },
  },
};
