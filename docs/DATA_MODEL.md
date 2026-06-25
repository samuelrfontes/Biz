# Bossman — Data Model

PostgreSQL. Every business-owned row carries `business_id` and is protected by
Row-Level Security (multi-tenant isolation is a hard requirement). The TypeScript
types in [`/lib/types.ts`](../lib/types.ts) mirror this schema so the prototype
and the real backend speak the same language.

## Entity overview

```
business ─┬─ owner / user
          ├─ service
          ├─ staff
          ├─ customer
          ├─ integration
          ├─ playbook_rule
          ├─ memory_fact ──(pgvector)
          ├─ conversation ──< conversation_turn
          │        └──< action_plan ──< plan_step ──< approval
          ├─ worker_run            (a task executed by a worker)
          └─ audit_event
```

The spine: **conversation → action_plan → plan_step → (approval) → worker_run →
audit_event**. That chain is the conversation-to-action loop, made durable.

## Core tables

### business (tenant root)
| column | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| name | text | "French Nail & Lashes" |
| niche | text | nail_salon, lash_studio, med_spa, barbershop… |
| timezone | text | IANA tz |
| bossman_phone | text | the Twilio number people call/text |
| created_at | timestamptz | |

### user (owner / operator)
`id, business_id fk, name, email, phone, role (owner|manager), auth_id`

### service
`id, business_id fk, name, price_cents int, duration_min int, active bool`

### staff
`id, business_id fk, name, role, constraints jsonb` — e.g.
`{"no_weekday_after":"17:00","reason":"childcare"}` (the Lena rule).

### customer
| column | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| business_id | uuid fk | |
| name, phone, email | text | |
| tags | text[] | "vip", "lash_regular" |
| last_visit | date | |
| lifetime_value_cents | int | |
| usual_service_id | uuid fk → service | drives segmentation |
| notes | text | |

### conversation
A single thread on one channel.
| column | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| business_id | uuid fk | |
| channel | enum | voice \| sms \| voice_note \| dashboard |
| participant | text | usually the owner |
| started_at, ended_at | timestamptz | |
| summary | text | model-generated |
| decisions | jsonb | array of decisions made |
| follow_ups | jsonb | open items |

### conversation_turn
`id, conversation_id fk, role (owner|bossman), text, audio_url?, created_at`
— the transcript, channel-agnostic.

### action_plan
What Bossman decided to do about a goal.
| column | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| business_id | uuid fk | |
| conversation_id | uuid fk | origin of the goal |
| goal | text | |
| constraints | jsonb | ["≤10% off", "premium tone", "approve mass text"] |
| status | enum | drafting \| active \| awaiting_approval \| complete \| cancelled |
| created_at | timestamptz | |

### plan_step
One unit of delegated work.
| column | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| plan_id | uuid fk | |
| worker_type | enum | front_desk, sales_followup, … |
| title, detail | text | |
| model | text | chosen by the router, recorded here |
| requires_approval | bool | from playbook evaluation |
| risk | enum | low \| medium \| high |
| status | enum | queued \| running \| waiting_approval \| done \| blocked |
| roi_estimate_cents | int | projected value |
| result | jsonb | output / proposed actions |
| ordinal | int | execution order |

### approval
A gated action awaiting the human.
| column | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| business_id | uuid fk | |
| plan_step_id | uuid fk | |
| worker_type | enum | who proposed it |
| kind | enum | discount \| refund \| public_post \| mass_text \| sensitive_reply |
| title, body | text | |
| preview | text | exactly what would go out |
| reason | text | which rule triggered the gate |
| risk | enum | |
| value_at_stake_cents | int | + revenue or − cost |
| status | enum | pending \| approved \| edited \| declined |
| requested_at, decided_at | timestamptz | |
| decided_by | uuid fk → user | |

### worker_run
The actual execution record of a step (separate from the plan so retries/tool
calls are captured).
`id, business_id fk, plan_step_id fk, worker_type, model, tool_calls jsonb,
status, started_at, finished_at, output jsonb`

### audit_event (append-only)
| column | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| business_id | uuid fk | |
| at | timestamptz | |
| actor | text | 'bossman' or a worker_type |
| action | text | human-readable |
| tool | text | tool + model used |
| outcome | text | |
| business_value_cents | int | |
| risk | enum | |
| ref_type, ref_id | text,uuid | links to plan_step / approval / conversation |

### playbook_rule
Per-business guardrails, evaluated on every proposed action.
`id, business_id fk, area (autonomy|pricing|tone|escalation), rule text,
mode (auto|approval|never), params jsonb` — e.g. `{"max_discount_pct":10}`.

### memory_fact
Durable business memory + semantic recall.
`id, business_id fk, kind (preference|fact|customer|decision), content text,
embedding vector(1536), source_conversation_id fk?, created_at`

### integration
`id, business_id fk, provider (twilio|google_calendar|square|stripe|gbp|quickbooks|
openai|anthropic|gemini), status (connected|available|action_needed),
credentials jsonb (encrypted), config jsonb`

### worker (reference / runtime state)
Mostly derived, but a small table tracks per-business worker config:
`business_id fk, worker_type, enabled bool, default_model, allowed_tools text[]`.

## Enums

```sql
channel        = voice | sms | voice_note | dashboard
worker_type    = front_desk | sales_followup | reputation | cfo
               | marketing | scheduling | support | operations
risk_level     = low | medium | high
task_status    = queued | running | waiting_approval | done | blocked
approval_kind  = discount | refund | public_post | mass_text | sensitive_reply
approval_state = pending | approved | edited | declined
rule_mode      = auto | approval | never
```

## Why it's shaped this way

- **Conversation is the entry point**, so plans hang off conversations — you can
  always trace an action back to the sentence the owner said.
- **Plan / step / approval / run are separate** so the loop is durable and
  auditable: you can see what was *intended*, what was *gated*, and what actually
  *ran*, independently.
- **The audit log is append-only and money-denominated** because the core promise
  is trusting AI with real business decisions.
- **Memory is first-class** (not just transcripts) so Bossman accumulates an
  understanding of the business instead of restarting cold every call.
