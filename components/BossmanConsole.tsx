"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { frenchNailScript } from "@/lib/scenario";
import { WORKER_META, WorkerType } from "@/lib/types";
import { RiskBadge } from "./ui";

// The console is a real multi-turn chat. Each message hits the live
// /api/bossman/converse brain (Claude when a key is set). Bossman replies, and
// when you give it an actual task it animates the plan → delegation → approval
// → report. You can always type a free-text reply; the suggestion chips are
// just shortcuts.

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

type Phase = "idle" | "playing" | "awaiting_chip" | "awaiting_approval" | "ready";
type Turn = { role: "owner" | "bossman"; text: string };

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

function buildBeats(r: ConverseResult): Beat[] {
  const beats: Beat[] = [{ kind: "think", text: "Thinking…" }];
  beats.push({ kind: "say", text: r.reply });
  if (r.clarifyingQuestion) {
    beats.push({
      kind: "ask",
      text: r.clarifyingQuestion,
      chips: r.quickReplies.length ? r.quickReplies : [],
    });
  }
  // Only render the plan machinery when there's an actual task to execute.
  if (r.steps.length > 0) {
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
        text: "Approved — putting it in motion. I'll only ping you if something needs a real decision.",
      });
    }
    if (r.report.length) beats.push({ kind: "report", lines: r.report });
  }
  return beats;
}

export function BossmanConsole() {
  const [mode, setMode] = useState<"call" | "text">("text");
  const [input, setInput] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [chips, setChips] = useState<string[]>([]);
  const [poweredBy, setPoweredBy] = useState<"claude" | "heuristic" | null>(null);
  const historyRef = useRef<Turn[]>([]);
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
      setPhase("ready");
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
        }, 900);
        break;
      case "say":
        historyRef.current.push({ role: "bossman", text: beat.text });
        setBlocks((b) => [...b, { t: "bossman", text: beat.text }]);
        schedule(() => advance(idx + 1), 850);
        break;
      case "ask":
        historyRef.current.push({ role: "bossman", text: beat.text });
        setBlocks((b) => [...b, { t: "bossman", text: beat.text }]);
        setChips(beat.chips);
        resumeIdx.current = idx + 1;
        setPhase("awaiting_chip");
        break;
      case "plan_open":
        setBlocks((b) => [...b, { t: "plan", goal: beat.goal, constraints: beat.constraints }]);
        schedule(() => advance(idx + 1), 750);
        break;
      case "delegate":
        setBlocks((b) => [
          ...b,
          { t: "delegate", worker: beat.worker, title: beat.title, model: beat.model, detail: beat.detail, rationale: beat.rationale, risk: beat.risk },
        ]);
        schedule(() => advance(idx + 1), 850);
        break;
      case "approval":
        setBlocks((b) => [...b, { t: "approval", title: beat.title, preview: beat.preview, reason: beat.reason }]);
        resumeIdx.current = idx + 1;
        setPhase("awaiting_approval");
        break;
      case "report":
        setBlocks((b) => [...b, { t: "report", lines: beat.lines }]);
        schedule(() => advance(idx + 1), 650);
        break;
    }
  }, []);

  const runTurn = async (text: string) => {
    clearTimers();
    setChips([]);
    setBlocks((b) => [...b, { t: "owner", text }]);
    setPhase("playing");
    const hist = historyRef.current.slice();
    historyRef.current.push({ role: "owner", text });

    let result: ConverseResult | null = null;
    try {
      const res = await fetch("/api/bossman/converse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: hist }),
      });
      if (res.ok) result = (await res.json()) as ConverseResult;
    } catch {
      /* fall through */
    }

    if (!result) {
      beatsRef.current = [{ kind: "say", text: "I hit a connection snag — try that again in a moment." }];
    } else {
      setPoweredBy(result.poweredBy);
      beatsRef.current = buildBeats(result);
    }
    schedule(() => advance(0), 400);
  };

  // Continue the current pre-generated sequence after a clarifying answer.
  const answerAndContinue = (text: string) => {
    setChips([]);
    historyRef.current.push({ role: "owner", text });
    setBlocks((b) => [...b, { t: "owner", text }]);
    schedule(() => advance(resumeIdx.current), 350);
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    if (phase === "awaiting_chip") answerAndContinue(text);
    else runTurn(text);
  };

  const onChip = (chip: string) => {
    if (phase === "awaiting_chip") answerAndContinue(chip);
  };

  const onApprove = (decided: "approved" | "edited") => {
    setBlocks((b) => b.map((x) => (x.t === "approval" && !x.decided ? { ...x, decided } : x)));
    schedule(() => advance(resumeIdx.current), 450);
  };

  const reset = () => {
    clearTimers();
    historyRef.current = [];
    beatsRef.current = [];
    setBlocks([]);
    setChips([]);
    setPhase("idle");
    setPoweredBy(null);
    setInput("");
  };

  const started = blocks.length > 0;
  const composerEnabled = phase === "idle" || phase === "ready" || phase === "awaiting_chip";

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-ink-900/70 shadow-glow backdrop-blur-xl">
      {/* header */}
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-b from-brass-400 to-brass-600 text-lg font-black text-ink-950 shadow-lg">
            B
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-900 bg-signal-green" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white">
              Bossman
              {poweredBy === "claude" && (
                <span className="rounded-full bg-brass-500/15 px-2 py-0.5 text-[10px] font-medium text-brass-400 ring-1 ring-brass-500/25">
                  live · Claude
                </span>
              )}
            </div>
            <div className="text-[12px] text-white/45">
              {phase === "playing"
                ? "Working…"
                : phase === "awaiting_chip"
                  ? "Waiting on your answer"
                  : phase === "awaiting_approval"
                    ? "Waiting on your approval"
                    : "Online"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {started && (
            <button
              onClick={reset}
              className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/55 transition hover:bg-white/10 hover:text-white"
            >
              New
            </button>
          )}
          <div className="flex items-center gap-1 rounded-full bg-white/[0.06] p-1 ring-1 ring-white/10">
            {(["call", "text"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                  mode === m ? "bg-brass-500/20 text-brass-400" : "text-white/50 hover:text-white"
                }`}
              >
                {m === "call" ? "Call" : "Text"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* transcript */}
      <div ref={scrollRef} className="scroll-thin max-h-[470px] min-h-[320px] space-y-3 overflow-y-auto px-5 py-6">
        {!started && (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-b from-brass-400 to-brass-600 text-2xl font-black text-ink-950 shadow-lg">
              B
            </div>
            <p className="max-w-xs text-[15px] leading-relaxed text-white/50">
              Talk to Bossman like a real operator. Tell it what you need — it'll make a plan, put
              your AI workforce on it, and check back only when it matters.
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
                className="rounded-full border border-brass-500/40 bg-brass-500/10 px-3.5 py-1.5 text-sm font-medium text-brass-400 transition hover:bg-brass-500/20 active:scale-95"
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* composer — always available */}
      <div className="border-t border-white/[0.07] px-4 py-3.5">
        {!started && (
          <div className="mb-3 flex flex-wrap gap-2">
            {frenchNailScript.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/55 transition hover:border-white/20 hover:text-white"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div
          className={`flex items-end gap-2 rounded-[22px] border border-white/10 bg-white/[0.04] px-2 py-1.5 transition focus-within:border-brass-500/40 ${
            composerEnabled ? "" : "opacity-50"
          }`}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (composerEnabled) send();
              }
            }}
            disabled={!composerEnabled}
            rows={1}
            placeholder={
              phase === "awaiting_chip"
                ? "Type your answer…"
                : started
                  ? "Message Bossman…"
                  : "Hey Bossman…"
            }
            className="scroll-thin max-h-28 flex-1 resize-none bg-transparent px-2.5 py-1.5 text-sm text-white placeholder-white/30 outline-none"
          />
          <button
            onClick={send}
            disabled={!composerEnabled || !input.trim()}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass-500 text-ink-950 transition hover:bg-brass-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
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
        <div className="flex justify-end animate-fade-up">
          <div className="max-w-[78%] rounded-[20px] rounded-br-md bg-gradient-to-b from-brass-400 to-brass-500 px-3.5 py-2.5 text-sm font-medium text-ink-950 shadow-sm">
            {block.text}
          </div>
        </div>
      );
    case "bossman":
      return (
        <div className="flex items-end gap-2 animate-fade-up">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-brass-400 to-brass-600 text-xs font-black text-ink-950">
            B
          </div>
          <div className="max-w-[80%] rounded-[20px] rounded-bl-md border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-sm leading-relaxed text-white/90 backdrop-blur">
            {block.text}
          </div>
        </div>
      );
    case "think":
      return (
        <div className="flex items-center gap-2.5 pl-9 text-xs text-white/40 animate-fade-up">
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
        <div className="ml-9 rounded-[20px] border border-brass-500/25 bg-brass-500/[0.06] p-4 animate-fade-up">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brass-400">Action Plan</div>
          <div className="text-sm font-medium text-white">{block.goal}</div>
          {block.constraints.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {block.constraints.map((c) => (
                <span key={c} className="rounded-lg bg-white/5 px-2 py-1 text-[11px] text-white/60 ring-1 ring-white/10">
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
        <div className="ml-9 flex items-start gap-3 rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-3 animate-fade-up">
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
              <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-white/45 ring-1 ring-white/10" title={block.rationale ? `Router: ${block.rationale}` : undefined}>
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
        <div className="ml-9 rounded-[20px] border border-signal-amber/30 bg-signal-amber/[0.06] p-4 animate-fade-up">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-signal-amber">✋ Needs your approval</div>
          <div className="text-sm font-medium text-white">{block.title}</div>
          <div className="mt-2 rounded-[14px] border border-white/8 bg-ink-950/50 p-3 text-sm italic text-white/70">“{block.preview}”</div>
          <div className="mt-2 text-xs text-white/45">{block.reason}</div>
          {block.decided ? (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-signal-green/10 px-3 py-1 text-xs font-medium text-signal-green ring-1 ring-signal-green/30">
              ✓ {block.decided === "approved" ? "Approved by you" : "Edited & approved"}
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <button onClick={() => onApprove("approved")} className="rounded-xl bg-signal-green/90 px-4 py-1.5 text-sm font-semibold text-ink-950 transition hover:bg-signal-green active:scale-95">
                Approve &amp; send
              </button>
              <button onClick={() => onApprove("edited")} className="rounded-xl bg-white/10 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-white/15 active:scale-95">
                Tweak first
              </button>
            </div>
          )}
        </div>
      );
    case "report":
      return (
        <div className="ml-9 rounded-[20px] border border-signal-green/25 bg-signal-green/[0.06] p-4 animate-fade-up">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-signal-green">✓ Report back</div>
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
