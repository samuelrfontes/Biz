import { Card, Pill } from "@/components/ui";
import { activeWorkspace, networkStats } from "@/lib/workspaces";
import { evolvedBrains } from "@/lib/evolution/seed";
import { autonomyTier, describeTone, AgentBrain } from "@/lib/evolution/evolution";
import { WORKER_META } from "@/lib/types";
import { MODEL_REGISTRY } from "@/lib/router/models";

function modelLabel(id: string) {
  return MODEL_REGISTRY.find((m) => m.id === id)?.label ?? id;
}

const tierMeta = {
  training: { label: "Training", tone: "neutral" as const, blurb: "Still learning your style" },
  trusted: { label: "Trusted", tone: "warn" as const, blurb: "Handles most work solo" },
  autopilot: { label: "Autopilot", tone: "good" as const, blurb: "Runs on its own within guardrails" },
};

export default function EvolutionPage() {
  const brains = evolvedBrains(activeWorkspace.enabledWorkers);
  const avg =
    brains.reduce((s, b) => s + b.evolutionLevel, 0) / Math.max(1, brains.length);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-brass-400">
          <span className="h-1.5 w-1.5 rounded-full bg-brass-400" /> Self-evolving workforce
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
          Your agents get better the more you use Bossman.
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          Every approval, edit, and outcome teaches your agents. They learn your voice, route to the
          models that actually land results for <em>your</em> customers, and earn more autonomy as
          they prove themselves. No two owners&apos; agents end up alike.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Workspace evolution" value={`${Math.round(avg * 100)}%`} tone="brass" />
        <Stat label="Active agents" value={`${brains.length}`} />
        <Stat label="Network businesses" value={networkStats.businesses.toLocaleString()} />
        <Stat label="Avg time to autopilot" value={`${networkStats.avgEvolutionWeeks} wks`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {brains
          .slice()
          .sort((a, b) => b.evolutionLevel - a.evolutionLevel)
          .map((b) => (
            <BrainCard key={b.worker} brain={b} />
          ))}
      </div>
    </div>
  );
}

function BrainCard({ brain }: { brain: AgentBrain }) {
  const meta = WORKER_META[brain.worker];
  const tier = tierMeta[autonomyTier(brain)];
  const bestModel = Object.entries(brain.modelAffinity).sort((a, b) => b[1] - a[1])[0];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-2xl ring-1 ring-white/10">
            {meta.emoji}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{meta.title}</div>
            <div className="text-[11px] text-white/45">Tone learned: {describeTone(brain.tone)}</div>
          </div>
        </div>
        <Pill tone={tier.tone}>{tier.label}</Pill>
      </div>

      {/* evolution bar */}
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[11px] text-white/45">
          <span>Evolution</span>
          <span>{Math.round(brain.evolutionLevel * 100)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brass-600 to-brass-400"
            style={{ width: `${Math.round(brain.evolutionLevel * 100)}%` }}
          />
        </div>
        <div className="mt-1 text-[11px] text-white/35">{tier.blurb}</div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Mini label="Proficiency" value={`${Math.round(brain.proficiency * 100)}%`} />
        <Mini label="Runs" value={`${brain.stats.runs}`} />
        <Mini
          label="Approved"
          value={`${Math.round((brain.stats.approved / Math.max(1, brain.stats.runs)) * 100)}%`}
        />
      </div>

      {bestModel && (
        <div className="mt-4 rounded-xl border border-white/8 bg-ink-800/40 p-3 text-xs">
          <span className="text-white/45">Best model for your work: </span>
          <span className="font-medium text-brass-400">{modelLabel(bestModel[0])}</span>
          <span className="text-white/35"> ({Math.round(bestModel[1] * 100)}% affinity)</span>
        </div>
      )}

      {brain.learnedPreferences.length > 0 && (
        <div className="mt-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
            What it&apos;s learned about you
          </div>
          <ul className="mt-1.5 space-y-1">
            {brain.learnedPreferences.slice(0, 3).map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-white/75">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brass-400" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "brass";
}) {
  return (
    <Card className="p-4">
      <div className="text-[11px] uppercase tracking-wide text-white/40">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone === "brass" ? "text-brass-400" : "text-white"}`}>
        {value}
      </div>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 py-2">
      <div className="text-sm font-bold text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-white/40">{label}</div>
    </div>
  );
}
