import Link from "next/link";
import { BossmanConsole } from "@/components/BossmanConsole";
import { Card, money, Pill, RiskBadge } from "@/components/ui";
import {
  approvals,
  business,
  conversations,
  currentPlan,
  metrics,
} from "@/lib/data";
import { WORKER_META } from "@/lib/types";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* hero */}
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-brass-400">
          <span className="h-1.5 w-1.5 rounded-full bg-brass-400" />
          The AI operator you can call
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          Good morning. {business.name} is running.
        </h1>
        <p className="max-w-2xl text-sm text-white/55">
          Talk to Bossman like you'd talk to a real operator. It understands the goal, makes a
          plan, puts your AI workforce on it, and checks back only when it needs you.
        </p>
      </header>

      {/* metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Recovered today" value={money(metrics.revenueRecoveredToday)} tone="brass" />
        <Metric label="Bookings today" value={`${metrics.bookingsToday}`} />
        <Metric label="Hours saved" value={`${metrics.hoursSaved}h`} />
        <Metric
          label="Waiting on you"
          value={`${metrics.approvalsWaiting}`}
          tone={metrics.approvalsWaiting ? "warn" : "neutral"}
          href="/approvals"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* console — the hero */}
        <div className="lg:col-span-3">
          <BossmanConsole />
        </div>

        {/* right rail */}
        <div className="space-y-6 lg:col-span-2">
          {/* clarification / approvals needed */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Needs you</h2>
              <Link href="/approvals" className="text-xs text-brass-400 hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-2.5">
              {approvals.slice(0, 2).map((a) => (
                <Link
                  key={a.id}
                  href="/approvals"
                  className="block rounded-xl border border-white/8 bg-ink-800/50 p-3 transition hover:border-white/15"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white">{a.title}</span>
                    <RiskBadge risk={a.risk} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-white/45">
                    <span>{WORKER_META[a.worker].title}</span>
                    {a.valueAtStake !== 0 && (
                      <Pill tone={a.valueAtStake > 0 ? "good" : "bad"}>
                        {a.valueAtStake > 0 ? "+" : ""}
                        {money(a.valueAtStake)}
                      </Pill>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {/* current action plan */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Current action plan</h2>
              <Pill tone="warn">awaiting approval</Pill>
            </div>
            <p className="mb-3 text-sm text-white/70">{currentPlan.goal}</p>
            <ol className="space-y-2">
              {currentPlan.steps.map((s, i) => (
                <li key={s.id} className="flex items-start gap-2.5 text-sm">
                  <StepDot status={s.status} index={i + 1} />
                  <div className="flex-1">
                    <div className="text-white/85">{s.title}</div>
                    <div className="text-[11px] text-white/40">
                      {WORKER_META[s.worker].title} · {s.model}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          {/* recent conversations */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Recent conversations</h2>
              <Link href="/memory" className="text-xs text-brass-400 hover:underline">
                Memory
              </Link>
            </div>
            <div className="space-y-2.5">
              {conversations.slice(0, 3).map((c) => (
                <Link
                  key={c.id}
                  href="/memory"
                  className="block rounded-xl border border-white/8 bg-ink-800/40 p-3 transition hover:border-white/15"
                >
                  <div className="flex items-center gap-2 text-[11px] text-white/40">
                    <ChannelTag channel={c.channel} />
                    <span>{c.durationLabel}</span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm text-white/75">{c.summary}</div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
  href,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "brass" | "warn";
  href?: string;
}) {
  const toneCls =
    tone === "brass"
      ? "text-brass-400"
      : tone === "warn"
        ? "text-signal-amber"
        : "text-white";
  const inner = (
    <Card className="p-4 transition hover:border-white/15">
      <div className="text-[11px] uppercase tracking-wide text-white/40">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${toneCls}`}>{value}</div>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function StepDot({ status, index }: { status: string; index: number }) {
  if (status === "done")
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-signal-green/15 text-[11px] text-signal-green ring-1 ring-signal-green/30">
        ✓
      </span>
    );
  if (status === "waiting_approval")
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-signal-amber/15 text-[11px] text-signal-amber ring-1 ring-signal-amber/30">
        ✋
      </span>
    );
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-[11px] text-white/40 ring-1 ring-white/10">
      {index}
    </span>
  );
}

function ChannelTag({ channel }: { channel: string }) {
  const map: Record<string, string> = {
    voice: "📞 Call",
    sms: "💬 Text",
    voice_note: "🎙 Voice note",
    dashboard: "🖥 Dashboard",
  };
  return (
    <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-white/55 ring-1 ring-white/10">
      {map[channel] ?? channel}
    </span>
  );
}
