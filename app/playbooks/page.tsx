import { Card, Pill } from "@/components/ui";
import { playbook } from "@/lib/data";
import { PlaybookRule } from "@/lib/types";

const areaLabel: Record<PlaybookRule["area"], string> = {
  autonomy: "What Bossman can do",
  pricing: "Money & discounts",
  tone: "Voice & tone",
  escalation: "When to stop & ask",
};

const areaOrder: PlaybookRule["area"][] = ["autonomy", "pricing", "escalation", "tone"];

function modePill(mode: PlaybookRule["mode"]) {
  if (mode === "auto") return <Pill tone="good">Auto</Pill>;
  if (mode === "approval") return <Pill tone="warn">Ask me first</Pill>;
  return <Pill tone="bad">Never</Pill>;
}

export default function PlaybooksPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Playbooks & Guardrails</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          The rules Bossman operates inside. Set what it can do on its own, what needs your
          sign-off, and what it should never touch. These are enforced on every action, by every
          worker.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {areaOrder.map((area) => {
          const rules = playbook.filter((r) => r.area === area);
          return (
            <Card key={area} className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-white">{areaLabel[area]}</h2>
              <div className="space-y-2.5">
                {rules.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-ink-800/40 px-3 py-2.5"
                  >
                    <span className="text-sm text-white/80">{r.rule}</span>
                    {modePill(r.mode)}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-white">Discount ceiling</h2>
        <p className="mt-1 text-sm text-white/55">
          Bossman can offer up to <span className="font-semibold text-brass-400">10% off</span>{" "}
          on its own. Anything higher comes to your approval queue with the projected cost attached.
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[40%] rounded-full bg-brass-500" />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-white/40">
          <span>0%</span>
          <span className="text-brass-400">10% auto-approve line</span>
          <span>25%</span>
        </div>
      </Card>
    </div>
  );
}
