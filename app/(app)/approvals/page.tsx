import { Card, money, Pill, RiskBadge } from "@/components/ui";
import { approvals } from "@/lib/data";
import { ApprovalKind, WORKER_META } from "@/lib/types";

const kindLabel: Record<ApprovalKind, string> = {
  discount: "Discount",
  refund: "Refund",
  public_post: "Public post",
  mass_text: "Mass text",
  sensitive_reply: "Sensitive reply",
};

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Approval Queue</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          Bossman acts on its own for the safe stuff. Anything risky — money, public posts, mass
          messages, unhappy customers — stops here for your one-tap sign-off.
        </p>
      </header>

      <div className="space-y-4">
        {approvals.map((a) => (
          <Card key={a.id} className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="brass">{kindLabel[a.kind]}</Pill>
              <RiskBadge risk={a.risk} />
              <span className="text-xs text-white/40">
                {WORKER_META[a.worker].emoji} {WORKER_META[a.worker].title}
              </span>
              {a.valueAtStake !== 0 && (
                <Pill tone={a.valueAtStake > 0 ? "good" : "bad"}>
                  {a.valueAtStake > 0 ? "+" : ""}
                  {money(a.valueAtStake)} at stake
                </Pill>
              )}
            </div>

            <h3 className="mt-3 text-base font-semibold text-white">{a.title}</h3>
            <p className="text-sm text-white/55">{a.body}</p>

            {a.preview && (
              <div className="mt-3 rounded-xl border border-white/8 bg-ink-950/50 p-3.5 text-sm italic text-white/70">
                “{a.preview}”
              </div>
            )}

            <div className="mt-3 flex items-center gap-2 text-xs text-signal-amber/90">
              <span>⚠</span> {a.reason}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-lg bg-signal-green/90 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-signal-green">
                Approve
              </button>
              <button className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15">
                Edit first
              </button>
              <button className="rounded-lg px-4 py-2 text-sm font-medium text-white/50 transition hover:text-signal-red">
                Decline
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
