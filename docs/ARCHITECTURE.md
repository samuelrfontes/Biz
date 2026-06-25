# Bossman — Technical Architecture

This document describes the real system behind the prototype. The product's job
is to turn a natural human conversation into safe, accountable AI work. The
architecture is organized around that one loop.

```
                       ┌─────────────────────────────────────────────┐
   Phone / SMS         │                  BOSSMAN                     │
   Voice note   ─────► │              (the Orchestrator)              │
   Dashboard           │                                             │
                       │  understands goal → plans → delegates →      │
                       │  gates risk → reports back → remembers       │
                       └───────┬───────────────────────────┬─────────┘
                               │                           │
                  ┌────────────▼─────────┐     ┌───────────▼───────────┐
                  │     Model Router     │     │   Approval Gate /     │
                  │  (Claude/GPT/Gemini) │     │   Human-in-the-loop   │
                  └────────────┬─────────┘     └───────────┬───────────┘
                               │                           │ (text/call back)
        ┌──────────────────────▼───────────────────────────▼───────────┐
        │                    AI WORKER FLEET                            │
        │  Front Desk · Sales Follow-Up · Reputation · CFO · Marketing  │
        │  Scheduling · Support · Operations                            │
        └──────────────────────┬────────────────────────────────────────┘
                               │  tool calls
        ┌──────────────────────▼────────────────────────────────────────┐
        │  Integrations: Twilio · Google Calendar · Square/Stripe ·      │
        │  Google Business Profile · QuickBooks                          │
        └────────────────────────────────────────────────────────────────┘

   Cross-cutting:  Memory Store · Audit Log · Playbook/Guardrail Engine
```

## Layers

### 1. Channels (how the human reaches Bossman)
The whole point is that the owner uses the channels they already use.

- **Voice** — a Twilio number. Inbound calls hit a media stream → realtime
  speech-to-text → Bossman → text-to-speech back. Bossman can also place
  outbound calls to clarify or confirm.
- **SMS** — Twilio messaging webhook. The default channel for quick back-and-forth.
- **Voice notes** — audio forwarded (SMS/WhatsApp/upload) → transcribed → treated
  as an owner turn.
- **Dashboard chat** — the web console (this prototype's home screen).

All channels normalize into the same thing: a **turn** in a **conversation**.
Bossman doesn't care which channel a goal arrived on.

### 2. Bossman — the Orchestrator (the brain)
A long-running, stateful agent (one logical instance per business). On each new
turn it:

1. **Loads context** — business profile, memory, playbook, open plans.
2. **Understands** — extracts goal, constraints, tone, urgency, and approval
   implications from natural language.
3. **Clarifies** — if a decision is genuinely the owner's to make, it asks one
   natural question instead of guessing (and waits, on the same channel).
4. **Plans** — produces an `ActionPlan`: ordered steps, each assigned a worker, a
   model/tool, a risk level, and whether it needs approval.
5. **Delegates** — dispatches steps to workers via the task queue.
6. **Gates** — anything the playbook marks `approval` stops and pings the owner.
7. **Reports** — summarizes outcome + business value, back on the owner's channel,
   only when there's something worth saying.

Implementation: this is an agent loop (planner + tool-use) using the strongest
model for planning (Claude Opus), with structured plan/step output so the rest
of the system stays deterministic and auditable.

### 3. Model Router
Bossman doesn't hard-code a model. Each task declares what it needs (reasoning
depth, latency, cost, modality) and the router picks:

- **Claude Opus** — planning, on-brand writing, sensitive replies, judgment.
- **GPT-4o / 4o-mini** — fast routing, realtime voice, high-volume cheap tasks.
- **Gemini** — optional alternative / fallback.

The router is a thin policy layer (capability + cost + health) so adding a model
is config, not code. Every routing decision is logged for the audit trail.

### 4. AI Worker Fleet
Specialized agents, each with a tight scope, its own allowed tools, and its own
default model. Workers are stateless task-runners — they receive a task, call
tools, return a result + proposed actions. They never message the owner directly;
they hand results back to Bossman, which decides what (if anything) the owner sees.

This separation is deliberate: the owner manages **one** relationship (Bossman),
and Bossman manages the fleet.

### 5. Approval Gate (human-in-the-loop)
The trust mechanism. A task that produces a risky action (money, public posts,
mass messages, sensitive replies, anything over a playbook threshold) is held as
an `Approval` with a preview and projected value. Bossman notifies the owner on
their channel; nothing executes until they approve. Approve/edit/decline all flow
back into the plan and the audit log.

### 6. Playbook / Guardrail Engine
A per-business policy evaluated on **every** proposed action, by every worker:
`auto` / `approval` / `never`, plus tone rules and numeric ceilings (e.g. ≤10%
discount). This is enforcement, not suggestion — it sits between "worker proposes
action" and "tool executes action".

### 7. Memory Store
Long-term business memory: profile (services, prices, staff, hours), owner
preferences, customers, and a rolling summary of past conversations + decisions.
Structured facts live in Postgres; semantic recall uses embeddings (pgvector) so
Bossman can pull "what did we decide about Lena's hours" without rereading every
transcript. Memory is what makes Bossman feel like it *knows* the business.

### 8. Audit Log
Append-only record of every decision: actor (Bossman or which worker), action,
model/tool used, outcome, business value, risk. Powers the audit screen and is
the accountability backbone for trusting AI with real money.

## Async execution

The system is event-driven, not request/response — a conversation kicks off work
that can run for minutes or hours.

- **Task queue** (e.g. BullMQ/Redis, or a durable workflow engine like
  Temporal/Inngest) runs plan steps, retries, and survives restarts.
- **Webhooks** from Twilio/Calendar/Square wake Bossman on external events
  (a reply came in, a slot opened).
- **Realtime** updates to the dashboard via WebSockets/SSE so the console
  reflects live work — exactly the "beats" the prototype scripts.

## Tech stack

| Concern | Choice |
| --- | --- |
| Frontend | Next.js / React (this app) |
| Backend | Node.js (TypeScript) services, or Python for ML-heavy parts |
| Database | PostgreSQL (Supabase) + pgvector for memory |
| Auth | Clerk or Supabase Auth |
| Voice / SMS | Twilio (Programmable Voice + Messaging) |
| AI models | OpenAI + Anthropic (+ optional Gemini) behind the Model Router |
| Calendar | Google Calendar API |
| Payments | Stripe / Square |
| Reputation | Google Business Profile API |
| Orchestration | Task queue + durable workflows + audit log + approval gates |

## Security & trust (non-negotiable for this product)

- **Multi-tenant isolation** — every row is scoped to a `business_id`
  (Postgres RLS). One business's agents can never see another's data.
- **Least-privilege tools** — each worker only holds the tool scopes it needs.
- **No silent money movement** — financial and public actions are gated by
  default; thresholds are owner-set in the playbook.
- **Everything is logged** — the audit trail is the source of truth for "what
  did the AI do and why".
- **Secrets** — integration tokens encrypted at rest; per-tenant credentials.
