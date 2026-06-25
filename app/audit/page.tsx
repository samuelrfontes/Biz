import { Card, money, RiskBadge } from "@/components/ui";
import { auditEvents } from "@/lib/data";
import { WORKER_META, WorkerType } from "@/lib/types";

function actorLabel(actor: string) {
  if (actor === "bossman") return "Bossman";
  return WORKER_META[actor as WorkerType]?.title ?? actor;
}
function actorEmoji(actor: string) {
  if (actor === "bossman") return "◎";
  return WORKER_META[actor as WorkerType]?.emoji ?? "•";
}

export default function AuditPage() {
  const totalValue = auditEvents.reduce((s, e) => s + e.businessValue, 0);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Audit Trail</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          Every decision, who made it, which model or tool ran it, the outcome, and what it was
          worth. Full accountability for your AI workforce.
        </p>
      </header>

      <Card className="flex items-center justify-between p-4">
        <span className="text-sm text-white/60">Tracked business value in this view</span>
        <span className="text-xl font-bold text-signal-green">{money(totalValue)}</span>
      </Card>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[140px_1fr_1fr_120px] gap-4 border-b border-white/8 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-white/40 md:grid">
          <div>When</div>
          <div>Action</div>
          <div>Tool / model</div>
          <div className="text-right">Value</div>
        </div>
        <div className="divide-y divide-white/6">
          {auditEvents.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-[140px_1fr_1fr_120px] md:items-center md:gap-4"
            >
              <div className="text-xs text-white/45">
                {new Date(e.at).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/90">{e.action}</span>
                  <RiskBadge risk={e.risk} />
                </div>
                <div className="mt-0.5 text-[11px] text-white/40">
                  {actorEmoji(e.actor)} {actorLabel(e.actor)} · {e.outcome}
                </div>
              </div>
              <div className="text-xs text-brass-400/85">{e.tool}</div>
              <div className="text-sm font-semibold md:text-right">
                {e.businessValue > 0 ? (
                  <span className="text-signal-green">{money(e.businessValue)}</span>
                ) : (
                  <span className="text-white/30">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
