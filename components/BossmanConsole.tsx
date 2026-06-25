"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { frenchNailScript } from "@/lib/scenario";
import { WORKER_META, WorkerType } from "@/lib/types";
import { RiskBadge } from "./ui";

// A beat is one thing Bossman does next. The beats are now built dynamically
// from the live /api/bossman/converse response — so the conversation actually
// reflects whatever the owner typed, for any business.
type Beat =
  | { kind: "think"; text: string }
  | { kind: "say"; text: string }
  | { kind: "ask"; text: string; chips: string[] }
  | { kind: "plan_open"; goal: string; constraints: string[] }
  | {
      kind: "delegate";
      worker: WorkerType;
      title: string;
      model: string;
      detail: string;
      rationale?: string;
      risk: "low" | "medium" | "high";
    }
  | { kind: "approval"; title: string; preview: string; reason: string }
  | { kind: "report"; lines: string[] };

type Block =
  | { t: "owner"; text: string }
  | { t: "bossman"; text: string }
  | { t: "think"; text: string }
  | { t: "plan"; goal: string; constraints: string[] }
  | {
      t: "delegate";
      worker: WorkerType;
      title: string;
      model: string;
      detail: string;
      rationale?: string;
      risk: "low" | "medium" | "high";
    }
  | { t: "approval"; title: string; preview: string; reason: string; decided?: "approved" | "edited" }
  | { t: "report"; lines: string[] };

type Phase = "idle" | "playing" | "awaiting_chip" | "awaiting_approval" | "done";

interface ConverseResult {
  reply: string;
  clarifyingQuestion: string | null;
  quickReplies: string[];
  goal: string;
  constraints: string[];
  steps: {
    worker: WorkerType;
    title: string;
    detail: string;
    model: string;
    rationale: string;
    risk: "low" | "medium" | "high";
  }[];
  approval: { title: string; preview: string; reason: string } | null;
  report: string[];
  poweredBy: "claude" | "heuristic";
}

/** Turn the brain's response into the sequence of beats the console plays. */
function buildBeats(r: ConverseResult): Beat[] {
  const beats: Beat[] = [{ kind: "think", text: "Reading your business, calendar, and guardrails…" }];
  beats.push({ kind: "say", text: r.reply });
  if (r.clarifyingQuestion) {
    beats.push({
      kind: "ask",
      text: r.clarifyingQuestion,
      chips: r.quickReplies.length ? r.quickReplies : ["Go ahead"],
    });
  }
  beats.push({ kind: "say", text: "Here's my plan." });
  beats.push({ kind: "plan_open", goal: r.goal, constraints: r.constraints });
  for (const s of r.steps) {
    beats.push({
      kind: "delegate",
      worker: s.worker,
      title: s.title,
      model: s.model,
      detail: s.detail,
      rationale: s.rationale,
      risk: s.risk,
    });
  }
  if (r.approval) {
    beats.push({ kind: "approval", title: r.approval.title, preview: r.approval.preview, reason: r.approval.reason });
    beats.push({
      kind: "say",
      text: "Approved — putting it in motion now. I'll only ping you if something needs a real decision.",
    });
  } else {
    beats.push({ kind: "say", text: "Nothing here needs your sign-off, so I'm running it now." });
  }
  if (r.report.length) beats.push({ kind: "report", lines: r.report });
  return beats;
}

export function BossmanConsole() {
  const [mode, setMode] = useState<"call" | "text">("text");
  const [input, setInput] = useState(frenchNailScript.ownerOpener);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [chips, setChips] = useState<string[]>([]);
  const [poweredBy, setPoweredBy] = useState<"claude" | "heuristic" | null>(null);
  const beatsRef = useRef<Beat[]>([]);
  const resumeIdx = useRef<number>(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const schedule = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  };

  useEffect(() => () => clearTimers(), []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [blocks, phase]);

  const advance = useCallback((idx: number) => {
    const beats = beatsRef.current;
    if (idx >= beats.length) {
      setPhase("done");
      return;
    }
    const beat = beats[idx];
    setPhase("playing");

    switch (beat.kind) {
      case "think":
        setBlocks((b) => [...b, { t: "think", text: beat.text }]);
        schedule(() => {
          setBlocks((b) => b.filter((x) => x.t !== "think"));
          advance(idx + 1);
        }, 1100);
        break;
      case "say":
        setBlocks((b) => [...b, { t: "bossman", text: beat.text }]);
        schedule(() => advance(idx + 1), 950);
        break;
      case "ask":
        setBlocks((b) => [...b, { t: "bossman", text: beat.text }]);
        setChips(beat.chips);
        resumeIdx.current = idx + 1;
        setPhase("awaiting_chip");
        break;
      case "plan_open":
        setBlocks((b) => [...b, { t: "plan", goal: beat.goal, constraints: beat.constraints }]);
        schedule(() => advance(idx + 1), 800);
        break;
      case "delegate":
        setBlocks((b) => [
          ...b,
          {
            t: "delegate",
            worker: beat.worker,
            title: beat.title,
            model: beat.model,
            detail: beat.detail,
            rationale: beat.rationale,
            risk: beat.risk,
          },
        ]);
        schedule(() => advance(idx + 1), 900);
        break;
      case "approval":
        setBlocks((b) => [
          ...b,
          { t: "approval", title: beat.title, preview: beat.preview, reason: beat.reason },
        ]);
        resumeIdx.current = idx + 1;
        setPhase("awaiting_approval");
        break;
      case "report":
        setBlocks((b) => [...b, { t: "report", lines: beat.lines }]);
        schedule(() => advance(idx + 1), 700);
        break;
    }
  }, []);

  const start = async () => {
    clearTimers();
    const opener = input.trim() || frenchNailScript.ownerOpener;
    setBlocks([{ t: "owner", text: opener }]);
    setChips([]);
    setPhase("playing");

    let result: ConverseResult | null = null;
    try {
      const res = await fetch("/api/bossman/converse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: opener }),
      });
      if (res.ok) result = (await res.json()) as ConverseResult;
    } catch {
      /* fall through to local fallback */
    }

    if (!result) {
      // Network failure: a minimal local beat so the UI never dead-ends.
      beatsRef.current = [
        { kind: "say", text: "I'm on it — give me one second to line up your workforce." },
        { kind: "report", lines: ["Connection hiccup — try again in a moment."] },
      ];
      setPoweredBy(null);
    } else {
      setPoweredBy(result.poweredBy);
      beatsRef.current = buildBeats(result);
    }
    schedule(() => advance(0), 450);
  };

  const reset = () => {
    clearTimers();
    beatsRef.current = [];
    setBlocks([]);
    setChips([]);
    setPhase("idle");
    setPoweredBy(null);
    setInput(frenchNailScript.ownerOpener);
  };

  const onChip = (chip: string) => {
    setChips([]);
    setBlocks((b) => [...b, { t: "owner", text: chip }]);
    schedule(() => advance(resumeIdx.current), 450);
  };

  const onApprove = (decided: "approved" | "edited") => {
    setBlocks((b) => b.map((x) => (x.t === "approval" && !x.decided ? { ...x, decided } : x)));
    schedule(() => advance(resumeIdx.current), 500);
  };

  const live = phase !== "idle";

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-ink-900/80 shadow-glow">
      {/* header */}
      <div className="flex items-center justify-between border-b border-white/8 bg-ink-950/60 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-brass-500/15 text-lg font-black text-brass-400 ring-1 ring-brass-500/30">
            B
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-950 bg-signal-green" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              Bossman
              {poweredBy === "claude" && (
                <span className="rounded-full bg-brass-500/15 px-2 py-0.5 text-[10px] font-medium text-brass-400 ring-1 ring-brass-500/25">
                  live · Claude
                </span>
              )}
            </div>
            <div className="text-[11px] text-white/45">
              {phase === "playing"
                ? "Working…"
                : phase === "awaiting_chip"
                  ? "Waiting on your answer"
                  : phase === "awaiting_approval"
                    ? "Waiting on your approval"
                    : "Online · ready when you are"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
          {(["call", "text"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                mode === m ? "bg-brass-500/20 text-brass-400" : "text-white/50 hover:text-white"
              }`}
            >
              {m === "call" ? "📞 Call" : "💬 Text"}
            </button>
          ))}
        </div>
      </div>

      {/* transcript */}
      <div ref={scrollRef} className="scroll-thin max-h-[460px] min-h-[300px] space-y-3 overflow-y-auto px-5 py-5">
        {!live && (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center">
            <p className="max-w-sm text-sm text-white/50">
              Talk to Bossman the way you'd talk to a real operator. It'll ask what it needs,
              make a plan, put your AI workers on it, and check back only when it matters.
            </p>
          </div>
        )}

        {blocks.map((b, i) => (
          <BlockView key={i} block={b} onApprove={onApprove} />
        ))}

        {phase === "awaiting_chip" && chips.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-11 animate-fade-up">
            {chips.map((c) => (
              <button
                key={c}
                onClick={() => onChip(c)}
                className="rounded-full border border-brass-500/40 bg-brass-500/10 px-3.5 py-1.5 text-sm font-medium text-brass-400 transition hover:bg-brass-500/20"
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* composer */}
      <div className="border-t border-white/8 bg-ink-950/60 px-5 py-4">
        {phase === "idle" || phase === "done" ? (
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={2}
                placeholder="Hey Bossman…"
                className="scroll-thin flex-1 resize-none rounded-xl border border-white/10 bg-ink-900 px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brass-500/40"
              />
              {phase === "done" ? (
                <button
                  onClick={reset}
                  className="shrink-0 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  New
                </button>
              ) : (
                <button
                  onClick={start}
                  className="shrink-0 rounded-xl bg-brass-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-brass-400"
                >
                  {mode === "call" ? "Call Bossman" : "Send"}
                </button>
              )}
            </div>
            {phase === "idle" && (
              <div className="flex flex-wrap gap-2">
                {frenchNailScript.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55 transition hover:border-white/20 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-white/40">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-signal-green animate-pulse-dot" />
              {mode === "call" ? "On the line with Bossman" : "Conversation in progress"}
            </span>
            <button onClick={reset} className="text-white/40 underline-offset-2 hover:text-white hover:underline">
              End
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ who }: { who: "owner" | "bossman" }) {
  if (who === "bossman") {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brass-500/15 text-sm font-black text-brass-400 ring-1 ring-brass-500/30">
        B
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-semibold text-white/70">
      You
    </div>
  );
}

function BlockView({
  block,
  onApprove,
}: {
  block: Block;
  onApprove: (d: "approved" | "edited") => void;
}) {
  switch (block.t) {
    case "owner":
      return (
        <div className="flex flex-row-reverse items-start gap-2.5 animate-fade-up">
          <Avatar who="owner" />
          <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-white/10 px-3.5 py-2.5 text-sm text-white">
            {block.text}
          </div>
        </div>
      );
    case "bossman":
      return (
        <div className="flex items-start gap-2.5 animate-fade-up">
          <Avatar who="bossman" />
          <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-white/8 bg-ink-800/80 px-3.5 py-2.5 text-sm text-white/90">
            {block.text}
          </div>
        </div>
      );
    case "think":
      return (
        <div className="flex items-center gap-2.5 pl-11 text-xs text-white/40 animate-fade-up">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-brass-400 animate-pulse-dot" />
            <span className="h-1.5 w-1.5 rounded-full bg-brass-400 animate-pulse-dot [animation-delay:0.2s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-brass-400 animate-pulse-dot [animation-delay:0.4s]" />
          </span>
          {block.text}
        </div>
      );
    case "plan":
      return (
        <div className="ml-11 rounded-2xl border border-brass-500/25 bg-brass-500/[0.06] p-4 animate-fade-up">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brass-400">
            Action Plan
          </div>
          <div className="text-sm font-medium text-white">{block.goal}</div>
          {block.constraints.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {block.constraints.map((c) => (
                <span
                  key={c}
                  className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-white/60 ring-1 ring-white/10"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    case "delegate": {
      const meta = WORKER_META[block.worker];
      return (
        <div className="ml-11 flex items-start gap-3 rounded-xl border border-white/8 bg-ink-800/60 p-3 animate-fade-up">
          <div className="text-xl">{meta.emoji}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-white">{block.title}</div>
              <RiskBadge risk={block.risk} />
            </div>
            <div className="text-xs text-white/55">{block.detail}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-white/35">
              <span className="text-brass-400/80">{meta.title}</span>
              <span>·</span>
              <span
                className="rounded bg-white/5 px-1.5 py-0.5 text-white/45 ring-1 ring-white/10"
                title={block.rationale ? `Router: ${block.rationale}` : undefined}
              >
                ◈ auto-routed → {block.model}
                {block.rationale ? ` · ${block.rationale}` : ""}
              </span>
              <span className="ml-auto inline-flex items-center gap-1 text-signal-green">
                <span className="h-1.5 w-1.5 rounded-full bg-signal-green" /> done
              </span>
            </div>
          </div>
        </div>
      );
    }
    case "approval":
      return (
        <div className="ml-11 rounded-2xl border border-signal-amber/30 bg-signal-amber/[0.06] p-4 animate-fade-up">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-signal-amber">
              ✋ Needs your approval
            </span>
          </div>
          <div className="text-sm font-medium text-white">{block.title}</div>
          <div className="mt-2 rounded-xl border border-white/8 bg-ink-950/60 p-3 text-sm italic text-white/70">
            “{block.preview}”
          </div>
          <div className="mt-2 text-xs text-white/45">{block.reason}</div>
          {block.decided ? (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-signal-green/10 px-3 py-1 text-xs font-medium text-signal-green ring-1 ring-signal-green/30">
              ✓ {block.decided === "approved" ? "Approved by you" : "Edited & approved"}
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onApprove("approved")}
                className="rounded-lg bg-signal-green/90 px-4 py-1.5 text-sm font-semibold text-ink-950 transition hover:bg-signal-green"
              >
                Approve & send
              </button>
              <button
                onClick={() => onApprove("edited")}
                className="rounded-lg bg-white/10 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Tweak first
              </button>
            </div>
          )}
        </div>
      );
    case "report":
      return (
        <div className="ml-11 rounded-2xl border border-signal-green/25 bg-signal-green/[0.06] p-4 animate-fade-up">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-signal-green">
            ✓ Report back
          </div>
          <ul className="space-y-1.5">
            {block.lines.map((l) => (
              <li key={l} className="flex items-start gap-2 text-sm text-white/85">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-signal-green" />
                {l}
              </li>
            ))}
          </ul>
        </div>
      );
  }
}
