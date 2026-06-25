import { Card, money, RiskBadge, StatusDot } from "@/components/ui";
import { workers } from "@/lib/data";
import { WORKER_META } from "@/lib/types";

export default function WorkersPage() {
  const working = workers.filter((w) => w.status !== "idle").length;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">AI Workforce</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          Specialized agents that report to Bossman. You don't manage them directly — Bossman
          picks the right one for each job, routes it to the right model, and keeps them in line.
          <span className="ml-1 text-white/70">{working} working now.</span>
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workers.map((w) => {
          const meta = WORKER_META[w.type];
          return (
            <Card key={w.type} className="flex flex-col p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-2xl ring-1 ring-white/10">
                    {meta.emoji}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{w.title}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-white/45">
                      <StatusDot status={w.status} />
                      {w.status === "working"
                        ? "Working"
                        : w.status === "needs_input"
                          ? "Needs input"
                          : "Idle"}
                    </div>
                  </div>
                </div>
                <RiskBadge risk={w.risk} />
              </div>

              <p className="mt-3 text-sm text-white/55">{w.blurb}</p>

              {w.currentTask && (
                <div className="mt-3 rounded-xl border border-white/8 bg-ink-800/50 p-3 text-xs text-white/70">
                  {w.currentTask}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3 text-xs">
                <div className="text-white/40">
                  Routed to <span className="text-brass-400/90">{w.model}</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-white/50">
                <span>{w.tasksToday} tasks today</span>
                <span className={w.roiToday > 0 ? "font-semibold text-signal-green" : "text-white/40"}>
                  {w.roiToday > 0 ? `${money(w.roiToday)} earned` : "—"}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
