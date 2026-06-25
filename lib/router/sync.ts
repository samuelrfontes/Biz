import { Capability, ModelProfile, Modality } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// MODEL SYNC — how Bossman "constantly keeps up with the latest models".
//
// Each provider exposes a way to list available models. A ProviderAdapter
// normalizes that list into ModelProfiles. syncModels() runs on a schedule
// (e.g. hourly cron / webhook), upserts new or changed models into the
// registry table, and flags deprecations. The moment a provider ships a new
// model, it becomes a routable option — no code change, no redeploy.
//
// New capability scores for a freshly-discovered model start from a
// provider/tier prior and are then calibrated by the live eval harness
// (calibrateFromEvals) using real task outcomes — so the registry self-tunes.
// ─────────────────────────────────────────────────────────────────────────

export interface RawModel {
  id: string;
  label?: string;
  contextTokens?: number;
  modalities?: Modality[];
  status?: "ga" | "preview" | "deprecated";
  releasedAt?: string;
  /** Some providers publish benchmark/capability hints we can seed from. */
  capabilityHints?: Partial<Record<Capability, number>>;
}

export interface ProviderAdapter {
  provider: string;
  /** List the provider's current catalog. Real impl: call the provider's
   *  /models endpoint with the tenant or platform key. */
  listModels(): Promise<RawModel[]>;
  /** A prior capability profile for a model whose scores we don't know yet,
   *  inferred from naming/tier (e.g. "opus" > "sonnet" > "haiku"). */
  prior(raw: RawModel): Partial<Record<Capability, number>>;
}

/** Map a provider's raw entry into our normalized ModelProfile. */
export function normalize(raw: RawModel, adapter: ProviderAdapter): ModelProfile {
  return {
    id: raw.id,
    label: raw.label ?? raw.id,
    provider: adapter.provider,
    status: raw.status ?? "preview", // brand-new models start as preview until evaluated
    releasedAt: raw.releasedAt ?? new Date().toISOString().slice(0, 10),
    contextTokens: raw.contextTokens ?? 128_000,
    modalities: raw.modalities ?? ["text"],
    caps: { ...adapter.prior(raw), ...(raw.capabilityHints ?? {}) },
    source: "sync",
    note: "Auto-discovered; capabilities calibrating from live evals.",
  };
}

/**
 * Pull every adapter's catalog and produce the upsert set. The persistence
 * layer (Postgres) diffs this against the current registry: inserts new
 * models, updates changed ones, marks vanished ones deprecated.
 */
export async function syncModels(adapters: ProviderAdapter[]): Promise<ModelProfile[]> {
  const discovered: ModelProfile[] = [];
  for (const adapter of adapters) {
    try {
      const raw = await adapter.listModels();
      for (const r of raw) discovered.push(normalize(r, adapter));
    } catch (err) {
      // One provider being down must never break the router for the others.
      console.error(`[model-sync] ${adapter.provider} failed:`, err);
    }
  }
  return discovered;
}

/**
 * Close the loop: nudge a model's capability scores from real outcomes.
 * Every routed task records whether it succeeded (owner approved, customer
 * replied, task completed). Aggregated, that signal calibrates the registry so
 * the best model for *this kind of work* keeps rising — the router gets smarter
 * with use, automatically.
 */
export function calibrateFromEvals(
  model: ModelProfile,
  evals: { capability: Capability; successRate: number; n: number }[],
  learningRate = 0.15,
): ModelProfile {
  const caps = { ...model.caps };
  for (const e of evals) {
    if (e.n < 20) continue; // need enough signal
    const current = caps[e.capability] ?? 0.5;
    caps[e.capability] = +(current + learningRate * (e.successRate - current)).toFixed(3);
  }
  return { ...model, caps };
}

// Example adapter (illustrative). Real adapters call provider APIs.
export const exampleAnthropicAdapter: ProviderAdapter = {
  provider: "anthropic",
  async listModels() {
    // return (await anthropic.models.list()).data.map(...)
    return [];
  },
  prior(raw) {
    const tier = /opus/i.test(raw.id) ? 0.95 : /sonnet/i.test(raw.id) ? 0.88 : 0.76;
    return { reasoning: tier, writing: tier, tool_use: tier, safety: 0.9 };
  },
};
