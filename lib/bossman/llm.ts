// ─────────────────────────────────────────────────────────────────────────
// LLM SEAM
//
// Bossman's reasoning (planning, onboarding config) is heuristic today so the
// app runs offline and deterministically. This module is the single seam where
// a real model takes over: if ANTHROPIC_API_KEY is set, completeJSON() asks
// Claude; otherwise callers fall back to their built-in heuristic.
//
// Deliberately dependency-free (uses global fetch) so there's nothing to
// install — drop in a key and the brain turns on. The router still chooses
// WHICH model executes each downstream task; this is the planner's own thinking.
// ─────────────────────────────────────────────────────────────────────────

export function isLLMEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** The model Bossman uses for its own planning/reasoning. Kept in one place so
 *  it tracks the registry's top reasoning model as the field evolves. */
export const PLANNER_MODEL = process.env.BOSSMAN_PLANNER_MODEL || "claude-opus-4-8";

interface CompleteOpts {
  system: string;
  user: string;
  maxTokens?: number;
}

/**
 * Ask Claude for a JSON object. Returns the parsed object, or null on any
 * failure (no key, network error, bad JSON) so callers can fall back cleanly.
 * Never throws into the request path.
 */
export async function completeJSON<T = unknown>(opts: CompleteOpts): Promise<T | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: PLANNER_MODEL,
        max_tokens: opts.maxTokens ?? 1024,
        system: opts.system + "\n\nRespond with ONLY a single valid JSON object. No prose, no code fences.",
        messages: [{ role: "user", content: opts.user }],
      }),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return null;
    return JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as T;
  } catch {
    return null;
  }
}
