import { Card } from "@/components/ui";
import { business, conversations } from "@/lib/data";

const channelLabel: Record<string, string> = {
  voice: "📞 Phone call",
  sms: "💬 Text",
  voice_note: "🎙 Voice note",
  dashboard: "🖥 Dashboard",
};

export default function MemoryPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Conversation Memory</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          Every call, text, and voice note — summarized, with the decisions made and the follow-ups
          owed. This is how Bossman remembers your business and your preferences over time.
        </p>
      </header>

      {/* what bossman knows */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-white">What Bossman remembers about {business.name}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Fact label="Services & prices">
            {business.services.map((s) => `${s.name} ($${s.price})`).join(" · ")}
          </Fact>
          <Fact label="Staff">{business.staff.map((s) => `${s.name} (${s.role})`).join(" · ")}</Fact>
          <Fact label="Standing rule">Lena: no weekday bookings after 5:00pm (childcare)</Fact>
          <Fact label="Tone">Warm, premium, confident — never desperate</Fact>
        </div>
      </Card>

      <div className="space-y-4">
        {conversations.map((c) => (
          <Card key={c.id} className="p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/45">
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-white/65 ring-1 ring-white/10">
                {channelLabel[c.channel]}
              </span>
              <span>{c.participant}</span>
              <span>·</span>
              <span>{new Date(c.startedAt).toLocaleString()}</span>
              <span>·</span>
              <span>{c.durationLabel}</span>
            </div>

            <p className="mt-3 text-sm font-medium text-white/90">{c.summary}</p>

            {/* transcript */}
            <div className="mt-4 space-y-2 rounded-xl border border-white/8 bg-ink-950/40 p-3.5">
              {c.transcript.map((t, i) => (
                <div key={i} className="text-sm">
                  <span
                    className={
                      t.role === "bossman"
                        ? "font-semibold text-brass-400"
                        : "font-semibold text-white/70"
                    }
                  >
                    {t.role === "bossman" ? "Bossman" : "You"}:
                  </span>{" "}
                  <span className="text-white/70">{t.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                  Decisions made
                </div>
                <ul className="mt-1.5 space-y-1">
                  {c.decisions.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm text-white/75">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-signal-green" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                  Follow-ups
                </div>
                {c.followUps.length ? (
                  <ul className="mt-1.5 space-y-1">
                    {c.followUps.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-white/75">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-signal-amber" />
                        {f}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-sm text-white/35">None — all handled.</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/8 bg-ink-800/40 p-3">
      <div className="text-[11px] uppercase tracking-wide text-white/40">{label}</div>
      <div className="mt-1 text-sm text-white/80">{children}</div>
    </div>
  );
}
