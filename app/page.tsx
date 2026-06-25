import Link from "next/link";
import { WORKER_META } from "@/lib/types";
import { networkStats } from "@/lib/workspaces";

// Public marketing landing page (root). No app sidebar — this is what the
// world sees first. CTAs lead into the live demo (/dashboard) and onboarding.

const workers = Object.values(WORKER_META);

const steps = [
  { n: "01", title: "You talk", body: "Call or text Bossman like a real operator. “We’re slow this week — fill the chairs, stay classy, max 10% off.”" },
  { n: "02", title: "It makes a plan", body: "Bossman understands the goal, your limits, and your tone — then lays out exactly how it’ll handle it." },
  { n: "03", title: "It delegates", body: "Specialized AI agents do the work, each routed to the best model for the job. You manage one Bossman, not a fleet." },
  { n: "04", title: "It reports back", body: "Risky moves wait for your one-tap approval. Everything else just gets done. You hear back only when it matters." },
];

const niches = [
  ["💅", "Salons & spas"], ["⚖️", "Law offices"], ["🩺", "Clinics & dental"],
  ["🛍️", "E-commerce"], ["🔨", "Home services"], ["🏠", "Real estate"],
  ["🍽️", "Restaurants"], ["🏋️", "Fitness studios"],
];

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      {/* nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink-950/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-b from-brass-400 to-brass-600 text-sm font-black text-ink-950 shadow">
              B
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-white">Bossman</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/dashboard" className="hidden rounded-full px-4 py-2 text-sm font-medium text-white/60 transition hover:text-white sm:block">
              See the demo
            </Link>
            <Link href="/onboarding" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-white/90">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* hero */}
      <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-20 text-center md:pt-28">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/60">
          <span className="h-1.5 w-1.5 rounded-full bg-brass-400" />
          The human conversation layer for AI work
        </div>
        <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-7xl">
          The AI operator
          <br />
          <span className="bg-gradient-to-r from-brass-400 to-brass-600 bg-clip-text text-transparent">
            you can call.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/55 md:text-xl">
          Stop prompting. Just talk. Bossman understands your business, makes a plan, picks the
          best AI for each job, and gets it done — checking back only when it needs you.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="w-full rounded-full bg-brass-500 px-7 py-3.5 text-base font-semibold text-ink-950 shadow-glow transition hover:bg-brass-400 sm:w-auto"
          >
            Talk to Bossman →
          </Link>
          <Link
            href="/onboarding"
            className="w-full rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-base font-semibold text-white transition hover:bg-white/[0.08] sm:w-auto"
          >
            Set up your own
          </Link>
        </div>
        <p className="mt-4 text-xs text-white/35">Live demo · no signup required</p>

        {/* floating chat preview */}
        <div className="mx-auto mt-16 max-w-lg text-left">
          <div className="rounded-[28px] border border-white/10 bg-ink-900/70 p-5 shadow-glow backdrop-blur-xl">
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-[20px] rounded-br-md bg-gradient-to-b from-brass-400 to-brass-500 px-3.5 py-2.5 text-sm font-medium text-ink-950">
                We’re slow tomorrow. Fill the chairs without sounding desperate — under 10% off.
              </div>
            </div>
            <div className="mt-3 flex items-end gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-brass-400 to-brass-600 text-xs font-black text-ink-950">
                B
              </div>
              <div className="max-w-[80%] rounded-[20px] rounded-bl-md border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-sm leading-relaxed text-white/90">
                On it. I’ll find quiet weekday regulars, draft a warm offer under your limit, and
                send it for your approval before anything goes out. Lashes, nails, or both?
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* the shift */}
      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          <Panel tone="muted" label="Normal AI">
            <ul className="space-y-3 text-white/55">
              <Li>You write the perfect prompt.</Li>
              <Li>It answers. You prompt again.</Li>
              <Li>You manage the whole workflow.</Li>
              <Li>You pick the model, the tools, the steps.</Li>
            </ul>
          </Panel>
          <Panel tone="brass" label="Bossman">
            <ul className="space-y-3 text-white/85">
              <Li good>You have a normal conversation.</Li>
              <Li good>It understands the goal and makes a plan.</Li>
              <Li good>It delegates to a workforce of agents.</Li>
              <Li good>It reports back — only when it matters.</Li>
            </ul>
          </Panel>
        </div>
      </Section>

      {/* how it works */}
      <Section title="From conversation to done." subtitle="The whole loop, handled.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-[22px] border border-white/[0.08] bg-ink-900/50 p-5 backdrop-blur-xl">
              <div className="text-sm font-bold text-brass-400">{s.n}</div>
              <div className="mt-2 text-lg font-semibold text-white">{s.title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-white/50">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* never pick a model */}
      <Section title="You never pick a model." subtitle="Bossman routes every task to the best AI available — and the moment a better one ships, it switches automatically.">
        <div className="rounded-[24px] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {["Claude Opus", "GPT-4o", "Gemini 2.5", "o3", "Claude Haiku", "…the next one"].map((m) => (
              <span key={m} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70">
                {m}
              </span>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-xl text-sm text-white/50">
            One operator, every model. Describe the work — Bossman scores them all and picks the
            right one for the job, every time.
          </p>
        </div>
      </Section>

      {/* the workforce */}
      <Section title="One operator. A whole workforce." subtitle="You manage Bossman. Bossman manages the agents.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {workers.map((w) => (
            <div key={w.title} className="flex flex-col items-center gap-2 rounded-[20px] border border-white/[0.07] bg-ink-900/50 p-5 text-center">
              <span className="text-3xl">{w.emoji}</span>
              <span className="text-sm font-medium text-white/80">{w.title}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* evolution + stats */}
      <Section>
        <div className="rounded-[24px] border border-white/[0.08] bg-ink-900/50 p-8 text-center backdrop-blur-xl md:p-12">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white md:text-4xl">
            It gets better the more you use it.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/55">
            Every approval, edit, and result teaches your agents your voice and your customers — so
            no two businesses’ Bossman end up alike.
          </p>
          <div className="mt-9 grid grid-cols-2 gap-6 md:grid-cols-4">
            <Stat value={networkStats.businesses.toLocaleString()} label="Businesses" />
            <Stat value={`${Math.round(networkStats.conversationsHandled / 1000)}k`} label="Conversations handled" />
            <Stat value={`$${(networkStats.revenueInfluenced / 1_000_000).toFixed(1)}M`} label="Revenue influenced" />
            <Stat value={`${networkStats.avgEvolutionWeeks} wks`} label="To autopilot" />
          </div>
        </div>
      </Section>

      {/* niches */}
      <Section title="Built for businesses that live on the phone." subtitle="Bossman adapts to whatever you do — it’s not niche-locked.">
        <div className="flex flex-wrap justify-center gap-2.5">
          {niches.map(([emoji, name]) => (
            <span key={name} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70">
              <span>{emoji}</span> {name}
            </span>
          ))}
        </div>
      </Section>

      {/* final CTA */}
      <section className="mx-auto max-w-6xl px-5 py-24 text-center">
        <h2 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
          Call Bossman.
          <br />
          <span className="text-white/40">Talk like a human.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-white/55">
          The AI work gets done. You stay in charge.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className="w-full rounded-full bg-brass-500 px-7 py-3.5 text-base font-semibold text-ink-950 shadow-glow transition hover:bg-brass-400 sm:w-auto">
            Try the live demo →
          </Link>
          <Link href="/onboarding" className="w-full rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-base font-semibold text-white transition hover:bg-white/[0.08] sm:w-auto">
            Set up your Bossman
          </Link>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-white/[0.06] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 text-sm text-white/40 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-b from-brass-400 to-brass-600 text-xs font-black text-ink-950">
              B
            </div>
            <span className="font-medium text-white/70">Bossman</span>
            <span className="text-white/30">— the operator you can call</span>
          </div>
          <div className="flex gap-5">
            <Link href="/dashboard" className="hover:text-white">Demo</Link>
            <Link href="/onboarding" className="hover:text-white">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      {title && (
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h2>
          {subtitle && <p className="mt-3 text-white/55">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

function Panel({
  children,
  label,
  tone,
}: {
  children: React.ReactNode;
  label: string;
  tone: "muted" | "brass";
}) {
  return (
    <div
      className={`rounded-[24px] border p-7 ${
        tone === "brass"
          ? "border-brass-500/30 bg-brass-500/[0.06]"
          : "border-white/[0.07] bg-ink-900/40"
      }`}
    >
      <div className={`mb-4 text-xs font-semibold uppercase tracking-widest ${tone === "brass" ? "text-brass-400" : "text-white/40"}`}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Li({ children, good }: { children: React.ReactNode; good?: boolean }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <span className={`mt-1 ${good ? "text-signal-green" : "text-white/30"}`}>{good ? "✓" : "—"}</span>
      <span>{children}</span>
    </li>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold text-white md:text-4xl">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-white/40">{label}</div>
    </div>
  );
}
