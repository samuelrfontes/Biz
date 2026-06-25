# Bossman

**The AI operator you can call.**
Call Bossman. Talk like a human. Bossman gets the AI work done.

Bossman is the **human conversation layer for AI work**. A business owner calls
or texts Bossman like a real operator — "we're slow this week, fill the chairs,
don't sound desperate, stay under 10% off" — and Bossman understands the goal,
makes a plan, delegates to a workforce of specialized AI agents, pauses on
anything risky for approval, and reports back only when it matters.

It is **not** another chatbot and **not** a dashboard for developers. The
dashboard is secondary. The magic is conversation-to-action.

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

The scripted demo lives in `/lib/scenario.ts` (a "beat sheet" the console
plays). In production those beats are real events emitted by the orchestrator.

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how the real system is wired:
  the orchestrator, the model router, workers, approval gates, memory.
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — the Postgres data model.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — what to build next, in order, to go
  from this prototype to a live first customer.
