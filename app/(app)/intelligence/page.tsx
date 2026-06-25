"use client";

import { useMemo, useState } from "react";
import { route } from "@/lib/router/router";
import { MODEL_REGISTRY, OBJECTIVES } from "@/lib/router/models";
import { Capability, Objective } from "@/lib/router/types";
import { Card, Pill } from "@/components/ui";

const OBJECTIVE_KEYS = Object.keys(OBJECTIVES) as Objective[];

const exampleTasks: { label: string; objective: Objective }[] = [
  { label: "“Draft a rebooking text to my regulars”", objective: "on_brand_writing" },
  { label: "“Plan a slow-week revenue push”", objective: "deep_reasoning" },
  { label: "“Answer the phone and book people in”", objective: "realtime_voice" },
  { label: "“Read this receipt photo”", objective: "vision" },
  { label: "“Summarize this 80-page contract”", objective: "long_document" },
  { label: "“Reply to 200 support tickets”", objective: "fast_cheap" },
];

export default function IntelligencePage() {
  const [objective, setObjective] = useState<Objective>("on_brand_writing");
  // user-facing nudges (never model names) — these become weight overrides
  const [quality, setQuality] = useState(0.7);
  const [speed, setSpeed] = useState(0.4);
  const [cost, setCost] = useState(0.4);

  const decision = useMemo(() => {
    const weights: Partial<Record<Capability, number>> = {
      reasoning: quality,
      writing: quality,
      speed,
      cost,
    };
    return route({ objective, weights });
  }, [objective, quality, speed, cost]);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-brass-400">
          <span className="h-1.5 w-1.5 rounded-full bg-brass-400" /> The intelligence layer
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
          You never pick a model. Bossman does.
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          Describe the work — Bossman turns it into a task profile and routes it to the best model
          available <em>right now</em>, across every provider. New model drops? It joins the lineup
          automatically and wins jobs the moment it&apos;s actually better.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* control */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-white">Give Bossman a task</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {exampleTasks.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setObjective(t.objective)}
                  className={`rounded-xl border px-3 py-1.5 text-left text-xs transition ${
                    objective === t.objective
                      ? "border-brass-500/50 bg-brass-500/10 text-brass-400"
                      : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-white/40">
              Detected objective
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {OBJECTIVE_KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => setObjective(k)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs transition ${
                    objective === k
                      ? "bg-white/10 text-white ring-1 ring-white/15"
                      : "text-white/45 hover:text-white"
                  }`}
                >
                  {OBJECTIVES[k].label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-white/45">{OBJECTIVES[objective].description}</p>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-white">
              Optional: nudge what matters
            </h2>
            <p className="mt-1 text-xs text-white/45">
              Owners speak in priorities, not parameters. Bossman translates.
            </p>
            <Slider label="Quality" value={quality} onChange={setQuality} />
            <Slider label="Speed" value={speed} onChange={setSpeed} />
            <Slider label="Cost-savings" value={cost} onChange={setCost} />
          </Card>
        </div>

        {/* decision */}
        <div className="space-y-4 lg:col-span-3">
          <Card className="border-brass-500/25 p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-brass-400">
                Bossman routed this to
              </span>
              <Pill tone="good">live decision</Pill>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-white">{decision.chosen.label}</span>
              <span className="text-xs text-white/45">{decision.chosen.provider}</span>
            </div>
            <p className="mt-2 text-sm text-white/60">{decision.explanation}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {decision.ranked[0].rationale
                .filter((r) => r.contribution > 0.001)
                .map((r) => (
                  <span
                    key={r.factor}
                    className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-white/60 ring-1 ring-white/10"
                  >
                    {r.factor.replace(/_/g, " ")}
                  </span>
                ))}
            </div>
            {decision.fallbacks.length > 0 && (
              <div className="mt-3 text-xs text-white/40">
                Fallback chain:{" "}
                {decision.fallbacks.map((f) => f.label).join(" → ")}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-white">The shortlist it scored</h2>
            <div className="space-y-2">
              {decision.ranked.map((r, i) => (
                <div key={r.model.id} className="flex items-center gap-3">
                  <span className="w-4 text-xs text-white/30">{i + 1}</span>
                  <div className="w-40 shrink-0">
                    <div className="text-sm text-white/85">{r.model.label}</div>
                    <div className="text-[10px] text-white/35">{r.model.provider}</div>
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                    <div
                      className={`h-full rounded-full ${i === 0 ? "bg-brass-500" : "bg-white/25"}`}
                      style={{ width: `${Math.round(r.score * 100)}%` }}
                    />
                  </div>
                  <span className="w-9 text-right text-xs tabular-nums text-white/50">
                    {Math.round(r.score * 100)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* registry */}
      <Card className="p-5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Model registry</h2>
          <Pill tone="brass">auto-synced</Pill>
        </div>
        <p className="mb-4 text-xs text-white/45">
          Every model Bossman can reach. Adding one is a single registry entry — the sync job
          ingests new releases from each provider, and the eval loop calibrates their strengths
          from real outcomes. No redeploy, no user setting.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {MODEL_REGISTRY.map((m) => (
            <div key={m.id} className="rounded-xl border border-white/8 bg-ink-800/40 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{m.label}</span>
                <Pill tone={m.status === "ga" ? "good" : "warn"}>{m.status}</Pill>
              </div>
              <div className="mt-0.5 text-[11px] text-white/40">
                {m.provider} · {(m.contextTokens / 1000).toLocaleString()}k ctx ·{" "}
                {new Date(m.releasedAt).toLocaleDateString([], { month: "short", year: "numeric" })}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {topCaps(m.caps).map((c) => (
                  <span
                    key={c}
                    className="rounded bg-brass-500/10 px-1.5 py-0.5 text-[10px] text-brass-400/90"
                  >
                    {c.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
              {m.note && <p className="mt-2 text-[11px] text-white/40">{m.note}</p>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function topCaps(caps: Partial<Record<Capability, number>>): Capability[] {
  return (Object.entries(caps) as [Capability, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c);
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="text-white/35">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-brass-500"
      />
    </div>
  );
}
