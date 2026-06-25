# Bossman — Build Roadmap

From this clickable prototype to a live first customer (French Nail & Lashes).
Ordered so that the **conversation-to-action loop is real end-to-end as early as
possible**, then hardened, then widened. Resist building the whole worker fleet
before one full loop works for real.

## Guiding principle

Ship the thinnest version of *"owner talks → AI does a real thing → owner sees the
result"* over real channels (SMS first), then add workers and polish around it.
The dashboard is the showroom; the conversation is the product.

---

## Phase 0 — Prototype (this repo) ✅
Clickable Next.js MVP centered on the conversation-to-action console, plus the
supporting screens, architecture, and data model. Used for design, demos, and
investor/owner conversations.

## Phase 1 — Foundations (week 1–2)
Goal: a real multi-tenant backend the loop can live on.

1. **Supabase project**: implement the schema in `docs/DATA_MODEL.md`; enable RLS
   scoped to `business_id`. Seed French Nail & Lashes.
2. **Auth** (Clerk or Supabase Auth) → owner logs into the dashboard.
3. **Persist the dashboard**: swap `/lib/data.ts` for live queries. Same UI.
4. **Audit log + playbook tables** wired so every write is recorded and
   guardrail-checked. Build these first — they're cross-cutting.

## Phase 2 — One real conversation channel (week 2–3)
Goal: the owner can actually **text** Bossman and get a conversational reply.

1. **Twilio SMS** number + inbound/outbound webhooks → normalize into
   `conversation` + `conversation_turn`.
2. **Bossman orchestrator v1**: an agent loop (Claude Opus) that loads business
   context + memory, understands the goal, asks one clarifying question when
   needed, and replies in the brand tone — all over SMS.
3. **Conversation memory**: summarize each thread; store `decisions`/`follow_ups`;
   begin `memory_fact` with pgvector recall.

> Milestone: the seeded "we're slow Thu/Fri, ≤10% off" message produces the real
> clarifying-question reply over SMS. That's the demo, live.

## Phase 3 — Conversation → action, for real (week 3–5)
Goal: close the loop on **one** high-value job end to end.

1. **Planner**: orchestrator emits a structured `action_plan` + `plan_step`s
   (the beats the prototype scripts).
2. **Model Router v1**: capability/cost policy choosing Opus vs GPT-4o(-mini),
   logged to audit.
3. **Task queue** (Inngest/Temporal/BullMQ) to run steps durably.
4. **First two workers**, because together they make the flagship use case work:
   - **Scheduling Agent** → Google Calendar (read availability, book).
   - **Sales Follow-Up Agent** → segment inactive clients (Square), draft outreach.
5. **Approval gate**: mass text held as an `approval`, owner approves by replying
   to an SMS; on approve, Twilio sends and **Front Desk Agent (v0)** handles the
   "YES" replies and books them in.
6. **Report back**: end-of-run SMS with bookings recovered + revenue + discount cost.

> Milestone: the full French Nail & Lashes rebooking story runs for real, money
> included, with the owner only touching one approval. **This is the product.**

## Phase 4 — Voice (week 5–7)
Goal: the owner can literally **call** Bossman.

1. Twilio Programmable Voice + media streams → realtime STT (e.g. Deepgram) →
   orchestrator → TTS (e.g. ElevenLabs/Cartesia).
2. Outbound calls for clarification/approval when text won't do.
3. Voice-note intake (transcribe → owner turn).

## Phase 5 — Workforce & trust depth (week 7–10)
Goal: broaden what Bossman handles and deepen guardrails.

1. Remaining workers: **Reputation** (GBP reviews), **CFO** (QuickBooks/Square
   reporting), **Marketing**, **Support**, **Operations**.
2. **Playbook editor** in the UI (owner sets autonomy, ceilings, tone).
3. Richer **audit & ROI** reporting (what made money this week).
4. Reliability: retries, idempotency, dead-letter handling, eval harness for
   tone/guardrail compliance.

## Phase 6 — Pilot hardening → first paying customer (week 10–12)
1. Security pass: per-tenant secret encryption, scope review, RLS tests.
2. Onboarding flow: connect Twilio/Calendar/Square in minutes; import customers.
3. Observability: traces per conversation, alerting on failed runs / stuck approvals.
4. Run the live pilot at French Nail & Lashes; instrument revenue recovered.

---

## Sequencing rules of thumb
- **SMS before voice** — cheaper to build, same loop, faster iteration.
- **Two workers + one approval gate** beats eight half-built workers.
- **Audit + playbook are infrastructure, not features** — build them in Phase 1.
- **Every phase ends with a demoable, real conversation**, not just internal plumbing.

## First niches after French Nail & Lashes
Nail salons → lash studios → med spas → barbershops → tattoo studios → dental →
home-service contractors. All phone/text-heavy with obvious revenue leaks, so the
same loop and worker fleet transfer with mostly config + tone changes.
