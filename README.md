# Bossman

**The AI operator you can call.**
Call Bossman. Talk like a human. Bossman gets the AI work done.

Bossman is the **operator that sits between a human and the entire AI
ecosystem**. You call or text it like a real operator — "we're slow this week,
fill the chairs, don't sound desperate, stay under 10% off" — and Bossman
understands the goal, **picks the best AI model for each part of the job**,
delegates to a workforce of specialized agents that **learn your business over
time**, pauses on anything risky for approval, and reports back only when it
matters.

It is **not** another chatbot and **not** a dashboard for developers. The
dashboard is secondary. The magic is conversation-to-action — and the engine
under it is built to stay on the frontier forever.

### What makes Bossman different
- **You never pick a model.** Bossman routes every task to the best available
  model across every provider. (`/intelligence`)
- **It keeps up automatically.** New LLM ships → it's a single registry entry (or
  an auto-sync), and it wins jobs the moment it's actually better. No redeploy,
  no user setting.
- **Your agents evolve.** Every approval, edit, and outcome teaches them your
  voice, your customers, and which model lands results for *you*. (`/evolution`)
- **One operator, many owners.** Multi-tenant by design — each account is a
  workspace with its own profile, guardrails, and evolved agents.

---

## The core loop

```
You talk  →  Bossman understands  →  makes a plan  →  delegates to AI workers
        →  pauses risky actions for your approval  →  gets it done  →  reports back
```

Normal AI: you prompt, it answers, you keep prompting, you manage the workflow.
Bossman: you have a normal business conversation and the workflow manages itself.

## The hierarchy

**Bossman** is the operator/manager. Under it sit specialized workers — Front
Desk, Sales Follow-Up, Reputation, CFO, Marketing, Scheduling, Customer Support,
Operations. You never manage the workers directly. Bossman does: it picks the
right worker for each job and routes each task to the best AI model/tool.

---

## What's in this MVP

A clickable Next.js prototype built around the conversation-to-action flow, with
the demo business **French Nail & Lashes**.

| Screen | What it shows |
| --- | --- |
| **Bossman** (`/`) | The hero. An interactive console: talk to Bossman and watch it ask a clarifying question, build a plan, delegate to workers, gate an approval, and report back. Plus live metrics, current plan, and what needs you. |
| **AI Workforce** (`/workers`) | The agents under Bossman — status, current task, which model they're routed to, tasks done, ROI, risk. |
| **Evolution** (`/evolution`) | Each agent's brain: how much it's learned about you, its proficiency, the model that performs best for *your* customers, learned preferences, and its autonomy tier (training → trusted → autopilot). Real, computed from a feedback history. |
| **Intelligence** (`/intelligence`) | The model router, live and interactive. Give it a task, nudge your priorities, and watch it score every model and pick one — with a rationale and fallback chain. Plus the auto-synced model registry. |
| **Approvals** (`/approvals`) | Refunds, discounts, public posts, mass texts, sensitive replies — the human approval gates. |
| **Memory** (`/memory`) | Calls, texts, voice notes — summarized, with decisions made and follow-ups owed, plus what Bossman remembers about the business. |
| **Playbooks** (`/playbooks`) | Guardrails: what's automatic, what needs approval, what's never allowed; tone and discount ceiling. |
| **Audit Trail** (`/audit`) | Every action: who/what model did it, the outcome, and the business value. |
| **Settings** (`/settings`) | Integrations — Twilio, Google Calendar, Square/Stripe, Google Business Profile, QuickBooks, and the AI models. |

> The console on the home screen is the thing to demo first. Click **Send**,
> answer the clarifying question, then **Approve & send**.

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

Requires Node 18.18+.

## Tech

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** for the UI
- Seeded in-memory data (`/lib/data.ts`) shaped to mirror the production
  schema. No backend yet — this is the conversation-to-action experience first.

### The real engine (working code, not mockups)
- **Model router** — `/lib/router/`. A pure, deterministic capability-based
  router (`route(spec)`), a data-driven registry (`models.ts` — add a model in
  one entry), objective presets, and a sync/calibration layer (`sync.ts`) for
  ingesting new releases and self-tuning from outcomes. The `/intelligence` page
  runs this live in your browser.
- **Self-evolving agents** — `/lib/evolution/`. `applyFeedback()` updates an
  agent's brain (proficiency, per-model affinity, tone vector, learned prefs,
  autonomy tier) from each owner action. The `/evolution` page renders brains
  computed by replaying a real feedback history.
- **Multi-tenant workspaces** — `/lib/workspaces.ts`. Several example owners
  across different niches prove the engine is not niche-locked.

The scripted demo lives in `/lib/scenario.ts` (a "beat sheet" the console
plays). In production those beats are real events emitted by the orchestrator.

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how the real system is wired:
  the orchestrator, the model router, workers, approval gates, memory.
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — the Postgres data model.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — what to build next, in order, to go
  from this prototype to a live first customer.
