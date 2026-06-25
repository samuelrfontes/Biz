"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, Pill } from "@/components/ui";
import { WORKER_META, WorkerType } from "@/lib/types";

interface Draft {
  name: string;
  kind: string;
  emoji: string;
  mandate: string;
  toneWords: string[];
  enabledWorkers: WorkerType[];
  guardrails: string[];
  source: "heuristic" | "llm";
}

const examples = [
  "I run French Nail & Lashes, a nail and lash studio. Keep my chairs full and clients loyal.",
  "We're a solo law firm. Screen new client inquiries and book consults, never miss a deadline.",
  "I own a Shopify skincare brand. Handle support, win back abandoned carts, keep reviews glowing.",
  "Castillo Contracting — answer every lead fast, quote jobs, and schedule my crews tight.",
];

type Phase = "ask" | "thinking" | "review" | "done";

export default function OnboardingPage() {
  const [phase, setPhase] = useState<Phase>("ask");
  const [description, setDescription] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");

  const submit = async () => {
    if (description.trim().length < 3) {
      setError("Tell me a little about what you do.");
      return;
    }
    setError("");
    setPhase("thinking");
    try {
      const res = await fetch("/api/bossman/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as Draft;
      // small beat so it feels like Bossman is thinking
      setTimeout(() => {
        setDraft(data);
        setPhase("review");
      }, 700);
    } catch {
      setError("Something went wrong reading that. Mind rephrasing?");
      setPhase("ask");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brass-500/15 text-2xl font-black text-brass-400 ring-1 ring-brass-500/30">
          B
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
          Let&apos;s set up your Bossman.
        </h1>
        <p className="mx-auto mt-1 max-w-lg text-sm text-white/55">
          No forms, no settings to wade through. Just tell me about your business like you&apos;d
          tell a new manager — I&apos;ll configure the rest and you can adjust anything.
        </p>
      </header>

      {(phase === "ask" || phase === "thinking") && (
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brass-500/15 text-sm font-black text-brass-400 ring-1 ring-brass-500/30">
              B
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-white/8 bg-ink-800/80 px-4 py-3 text-sm text-white/90">
              Hey — I&apos;m Bossman. What kind of business do you run, and what should I take off
              your plate?
            </div>
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={phase === "thinking"}
            placeholder="e.g. I run a nail & lash studio. Keep my chairs full, handle texts, and don't sound desperate when it's slow."
            className="scroll-thin mt-4 w-full resize-none rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-brass-500/40"
          />
          {error && <p className="mt-2 text-xs text-signal-red">{error}</p>}

          <div className="mt-3 flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setDescription(ex)}
                disabled={phase === "thinking"}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55 transition hover:border-white/20 hover:text-white"
              >
                {ex.split(".")[0]}
              </button>
            ))}
          </div>

          <button
            onClick={submit}
            disabled={phase === "thinking"}
            className="mt-5 w-full rounded-xl bg-brass-500 px-5 py-3 text-sm font-semibold text-ink-950 transition hover:bg-brass-400 disabled:opacity-60"
          >
            {phase === "thinking" ? "Setting things up…" : "Set up my Bossman"}
          </button>
        </Card>
      )}

      {phase === "review" && draft && (
        <div className="space-y-4 animate-fade-up">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brass-500/15 text-sm font-black text-brass-400 ring-1 ring-brass-500/30">
              B
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-white/8 bg-ink-800/80 px-4 py-3 text-sm text-white/90">
              Got it. Here&apos;s how I&apos;ll run things for{" "}
              <span className="font-semibold text-white">{draft.name}</span> — tweak anything later.
            </div>
          </div>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-2xl ring-1 ring-white/10">
                {draft.emoji}
              </div>
              <div>
                <div className="text-lg font-bold text-white">{draft.name}</div>
                <div className="text-xs text-white/45">{draft.kind}</div>
              </div>
              <span className="ml-auto">
                <Pill tone={draft.source === "llm" ? "brass" : "neutral"}>
                  {draft.source === "llm" ? "configured by Claude" : "auto-configured"}
                </Pill>
              </span>
            </div>

            <Section label="What I'll focus on">
              <p className="text-sm text-white/80">{draft.mandate}</p>
            </Section>

            <Section label="Your voice">
              <div className="flex flex-wrap gap-1.5">
                {draft.toneWords.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-brass-500/10 px-2 py-1 text-xs text-brass-400 ring-1 ring-brass-500/25"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Section>

            <Section label={`Agents I'll put to work (${draft.enabledWorkers.length})`}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {draft.enabledWorkers.map((w) => (
                  <div
                    key={w}
                    className="flex items-center gap-2 rounded-xl border border-white/8 bg-ink-800/40 px-3 py-2"
                  >
                    <span className="text-lg">{WORKER_META[w].emoji}</span>
                    <span className="text-xs text-white/80">{WORKER_META[w].title}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section label="Starter guardrails">
              <ul className="space-y-1.5">
                {draft.guardrails.map((g) => (
                  <li key={g} className="flex items-start gap-2 text-sm text-white/75">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-signal-green" />
                    {g}
                  </li>
                ))}
              </ul>
            </Section>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => setPhase("done")}
                className="flex-1 rounded-xl bg-brass-500 px-5 py-3 text-sm font-semibold text-ink-950 transition hover:bg-brass-400"
              >
                Looks right — activate Bossman
              </button>
              <button
                onClick={() => setPhase("ask")}
                className="rounded-xl bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Let me rephrase
              </button>
            </div>
          </Card>
        </div>
      )}

      {phase === "done" && draft && (
        <Card className="p-8 text-center animate-fade-up">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-signal-green/15 text-2xl text-signal-green ring-1 ring-signal-green/30">
            ✓
          </div>
          <h2 className="mt-4 text-xl font-bold text-white">
            Bossman is on the job for {draft.name}.
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-white/55">
            Your number is live and your agents are standing by. Call or text Bossman like you would
            a real operator — it&apos;ll take it from there.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-xl bg-brass-500 px-6 py-3 text-sm font-semibold text-ink-950 transition hover:bg-brass-400"
          >
            Go to my Bossman
          </Link>
        </Card>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 border-t border-white/8 pt-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">
        {label}
      </div>
      {children}
    </div>
  );
}
