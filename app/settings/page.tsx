import { Card, Pill } from "@/components/ui";
import { business, integrations } from "@/lib/data";
import { Integration } from "@/lib/types";

function statusPill(status: Integration["status"]) {
  if (status === "connected") return <Pill tone="good">Connected</Pill>;
  if (status === "action_needed") return <Pill tone="warn">Action needed</Pill>;
  return <Pill tone="neutral">Connect</Pill>;
}

export default function SettingsPage() {
  const categories = Array.from(new Set(integrations.map((i) => i.category)));
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings & Integrations</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          The tools Bossman uses to actually get work done. Connect your phone line, calendar,
          payments, and the AI models it routes between.
        </p>
      </header>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-white">Business</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Name" value={business.name} />
          <Field label="Type" value={business.niche} />
          <Field label="Bossman number" value={business.phone} />
        </div>
      </Card>

      {categories.map((cat) => (
        <div key={cat}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
            {cat}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {integrations
              .filter((i) => i.category === cat)
              .map((i) => (
                <Card key={i.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-sm font-semibold text-white">{i.name}</div>
                    <div className="text-xs text-white/50">{i.purpose}</div>
                  </div>
                  {statusPill(i.status)}
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-ink-800/40 p-3">
      <div className="text-[11px] uppercase tracking-wide text-white/40">{label}</div>
      <div className="mt-1 text-sm text-white/85">{value}</div>
    </div>
  );
}
