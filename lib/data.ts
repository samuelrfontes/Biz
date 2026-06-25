import {
  ActionPlan,
  Approval,
  AuditEvent,
  Business,
  Conversation,
  Integration,
  PlaybookRule,
  Worker,
} from "./types";

// ---------------------------------------------------------------------------
// Demo business: French Nail & Lashes
// ---------------------------------------------------------------------------

export const business: Business = {
  id: "biz_french_nail_lashes",
  name: "French Nail & Lashes",
  niche: "Nail & Lash Studio",
  timezone: "America/New_York",
  phone: "+1 (415) 555-0182",
  services: [
    { id: "svc_full_set", name: "Full Set Lashes", price: 140, durationMin: 120 },
    { id: "svc_lash_fill", name: "Lash Fill", price: 75, durationMin: 75 },
    { id: "svc_gel_mani", name: "Gel Manicure", price: 55, durationMin: 60 },
    { id: "svc_pedi", name: "Deluxe Pedicure", price: 70, durationMin: 70 },
  ],
  staff: [
    { id: "stf_mai", name: "Mai", role: "Lash Artist" },
    { id: "stf_tran", name: "Tran", role: "Nail Tech" },
    { id: "stf_lena", name: "Lena", role: "Nail Tech" },
  ],
};

// ---------------------------------------------------------------------------
// AI Workforce under Bossman
// ---------------------------------------------------------------------------

export const workers: Worker[] = [
  {
    type: "sales_followup",
    title: "Sales Follow-Up Agent",
    blurb: "Re-books inactive customers and recovers no-shows.",
    status: "working",
    model: "Claude Opus 4.8 · drafting",
    currentTask: "Drafting weekday rebooking campaign (38 inactive clients)",
    tasksToday: 4,
    roiToday: 0,
    risk: "medium",
  },
  {
    type: "scheduling",
    title: "Scheduling Agent",
    blurb: "Watches the calendar, fills gaps, prevents double-booking.",
    status: "working",
    model: "GPT-4o · tools: Google Calendar",
    currentTask: "Found 11 open slots Thu–Fri across Mai & Tran",
    tasksToday: 6,
    roiToday: 280,
    risk: "low",
  },
  {
    type: "front_desk",
    title: "Front Desk Agent",
    blurb: "Answers calls & texts, books appointments, handles FAQs.",
    status: "idle",
    model: "GPT-4o-mini · voice (Twilio)",
    currentTask: undefined,
    tasksToday: 23,
    roiToday: 610,
    risk: "low",
  },
  {
    type: "reputation",
    title: "Reputation Agent",
    blurb: "Requests reviews from happy clients, flags unhappy ones.",
    status: "needs_input",
    model: "Claude Sonnet 4.6",
    currentTask: "1 sensitive 3★ reply waiting for your approval",
    tasksToday: 5,
    roiToday: 0,
    risk: "high",
  },
  {
    type: "marketing",
    title: "Marketing Agent",
    blurb: "Plans posts & promos, keeps the brand voice on-tone.",
    status: "idle",
    model: "Claude Opus 4.8 + image gen",
    tasksToday: 1,
    roiToday: 0,
    risk: "medium",
  },
  {
    type: "cfo",
    title: "CFO Agent",
    blurb: "Tracks revenue, margins, and the cost of each promo.",
    status: "idle",
    model: "GPT-4o · tools: Square, QuickBooks",
    currentTask: undefined,
    tasksToday: 2,
    roiToday: 0,
    risk: "low",
  },
  {
    type: "support",
    title: "Customer Support Agent",
    blurb: "Handles reschedules, refunds requests, and questions.",
    status: "idle",
    model: "GPT-4o-mini",
    tasksToday: 8,
    roiToday: 0,
    risk: "medium",
  },
  {
    type: "operations",
    title: "Operations Agent",
    blurb: "Watches supplies, staffing, and daily open/close tasks.",
    status: "idle",
    model: "GPT-4o-mini",
    tasksToday: 3,
    roiToday: 0,
    risk: "low",
  },
];

// ---------------------------------------------------------------------------
// The plan Bossman produces from the seeded conversation
// ---------------------------------------------------------------------------

export const currentPlan: ActionPlan = {
  id: "plan_weekday_rebook",
  conversationId: "conv_001",
  goal: "Fill Thursday & Friday without sounding desperate. Discounts ≤ 10% unless approved.",
  constraints: [
    "Max 10% discount without owner approval",
    "Friendly, premium tone — never desperate",
    "Owner approves any mass text before it sends",
  ],
  status: "awaiting_approval",
  createdAt: "2026-06-25T09:14:00-04:00",
  steps: [
    {
      id: "step_1",
      worker: "scheduling",
      title: "Map open slots Thu–Fri",
      detail: "Pulled Google Calendar: 11 openings across Mai (lashes) and Tran (nails).",
      model: "GPT-4o · Google Calendar API",
      requiresApproval: false,
      risk: "low",
      status: "done",
      roiEstimate: 0,
    },
    {
      id: "step_2",
      worker: "cfo",
      title: "Find weekday-leaning inactive clients",
      detail: "38 clients who usually book Mon–Fri and haven't visited in 35+ days.",
      model: "GPT-4o · Square export",
      requiresApproval: false,
      risk: "low",
      status: "done",
    },
    {
      id: "step_3",
      worker: "sales_followup",
      title: "Draft rebooking text (≤10% off)",
      detail: "Warm, on-brand message offering a 'midweek touch-up' with a soft 10% incentive.",
      model: "Claude Opus 4.8",
      requiresApproval: true,
      risk: "medium",
      status: "waiting_approval",
      roiEstimate: 1240,
    },
    {
      id: "step_4",
      worker: "front_desk",
      title: "Handle the replies & book them in",
      detail: "Answer responses, confirm times, write them straight into the calendar.",
      model: "GPT-4o-mini · Twilio + Calendar",
      requiresApproval: false,
      risk: "low",
      status: "queued",
    },
    {
      id: "step_5",
      worker: "cfo",
      title: "Report what it made",
      detail: "Tonight: bookings recovered, revenue added, discount cost.",
      model: "GPT-4o",
      requiresApproval: false,
      risk: "low",
      status: "queued",
    },
  ],
};

// ---------------------------------------------------------------------------
// Conversations (memory)
// ---------------------------------------------------------------------------

export const conversations: Conversation[] = [
  {
    id: "conv_001",
    channel: "voice",
    participant: "You → Bossman",
    startedAt: "2026-06-25T09:12:00-04:00",
    durationLabel: "2m 41s",
    summary:
      "Owner is slow Thu & Fri and wants more bookings without sounding desperate. Capped discounts at 10%.",
    decisions: [
      "Run a weekday rebooking push to inactive clients",
      "Discount ceiling: 10% unless owner approves more",
      "Prioritize both lashes and nails",
    ],
    followUps: ["Approve the drafted mass text before it sends"],
    transcript: [
      {
        role: "owner",
        text: "Hey Bossman, we're slow tomorrow and Friday. Can you get more people booked without sounding desperate? Don't go above 10% off unless I approve it.",
      },
      {
        role: "bossman",
        text: "Got it. I'll check openings, find inactive customers who usually book on weekdays, draft a friendly rebooking campaign under your discount limit, and send it to you for approval before anything goes out. Do you want to prioritize lashes, nails, or both?",
      },
      { role: "owner", text: "Both. And keep it classy." },
      {
        role: "bossman",
        text: "Classy and under 10% off. I'll have a draft text and the target list ready for your approval in a few minutes.",
      },
    ],
  },
  {
    id: "conv_002",
    channel: "sms",
    participant: "You → Bossman",
    startedAt: "2026-06-24T18:02:00-04:00",
    durationLabel: "SMS",
    summary: "Owner asked Bossman to stop booking Lena after 5pm on weekdays (childcare).",
    decisions: ["Lena: no weekday bookings after 5:00pm"],
    followUps: [],
    transcript: [
      { role: "owner", text: "Don't book Lena past 5 on weekdays anymore, she's got her kid." },
      {
        role: "bossman",
        text: "Done — I've added that to her schedule rules. Front Desk and Scheduling will respect it from now on. Want me to apply it to weekends too?",
      },
      { role: "owner", text: "No just weekdays." },
    ],
  },
  {
    id: "conv_003",
    channel: "voice_note",
    participant: "You → Bossman",
    startedAt: "2026-06-23T11:40:00-04:00",
    durationLabel: "0m 38s",
    summary: "Owner forwarded a voice note: a regular (Jasmine) was unhappy about a rushed fill.",
    decisions: ["Comp Jasmine's next fill 50% as goodwill (owner pre-approved)"],
    followUps: ["Reputation Agent to send a warm personal apology, not a template"],
    transcript: [
      {
        role: "owner",
        text: "(voice note) Jasmine left kind of unhappy, the fill felt rushed. Take care of her, comp half her next one.",
      },
      {
        role: "bossman",
        text: "I hear you. I'll have Reputation send a personal apology in your voice and load a 50%-off code for her next fill. I'll keep it off any public channel.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Approval queue
// ---------------------------------------------------------------------------

export const approvals: Approval[] = [
  {
    id: "appr_001",
    kind: "mass_text",
    worker: "sales_followup",
    title: "Weekday rebooking text → 38 clients",
    body: "Send the drafted SMS campaign to 38 inactive weekday clients.",
    reason: "Mass texts always need your sign-off (playbook rule).",
    risk: "medium",
    valueAtStake: 1240,
    requestedAt: "2026-06-25T09:16:00-04:00",
    preview:
      "Hi {{first}}, it's French Nail & Lashes 💅 We saved a couple of midweek spots this Thu/Fri and thought of you. Treat yourself to a fresh set — 10% off if you book by tonight. Reply YES and I'll find your time!",
  },
  {
    id: "appr_002",
    kind: "sensitive_reply",
    worker: "reputation",
    title: "Reply to a 3★ Google review",
    body: "Respond publicly to Dani R.'s 3-star review about wait time.",
    reason: "Public + sensitive customer reply — needs human approval.",
    risk: "high",
    valueAtStake: 0,
    requestedAt: "2026-06-25T08:40:00-04:00",
    preview:
      "Hi Dani, thank you for the honest feedback — you're right that the wait ran long that afternoon and we're sorry. We've adjusted our Thursday scheduling so it doesn't happen again. We'd love to make it up to you on your next visit. — Mai",
  },
  {
    id: "appr_003",
    kind: "discount",
    worker: "marketing",
    title: "15% 'bring a friend' weekend promo",
    body: "Run a 15% referral discount this weekend (above your 10% ceiling).",
    reason: "Above the 10% discount limit you set.",
    risk: "medium",
    valueAtStake: -420,
    requestedAt: "2026-06-25T07:55:00-04:00",
    preview:
      "Refer a friend this weekend — you both get 15% off. Projected: +9 bookings, ~$420 in discount cost.",
  },
];

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

export const auditEvents: AuditEvent[] = [
  {
    id: "aud_001",
    at: "2026-06-25T09:15:10-04:00",
    actor: "bossman",
    action: "Created plan: 'Fill Thu/Fri weekday rebooking'",
    tool: "Planner · Claude Opus 4.8",
    outcome: "5-step plan, 1 approval gate",
    businessValue: 0,
    risk: "low",
  },
  {
    id: "aud_002",
    at: "2026-06-25T09:14:30-04:00",
    actor: "scheduling",
    action: "Read calendar availability Thu–Fri",
    tool: "Google Calendar API",
    outcome: "11 open slots identified",
    businessValue: 0,
    risk: "low",
  },
  {
    id: "aud_003",
    at: "2026-06-25T09:14:55-04:00",
    actor: "cfo",
    action: "Segmented inactive weekday clients",
    tool: "Square export · GPT-4o",
    outcome: "38 clients matched",
    businessValue: 0,
    risk: "low",
  },
  {
    id: "aud_004",
    at: "2026-06-25T08:31:00-04:00",
    actor: "front_desk",
    action: "Booked appointment by phone (inbound)",
    tool: "Twilio Voice · GPT-4o-mini · Calendar",
    outcome: "Gel mani booked, Tran, Thu 2pm",
    businessValue: 55,
    risk: "low",
  },
  {
    id: "aud_005",
    at: "2026-06-25T08:05:00-04:00",
    actor: "reputation",
    action: "Requested review from happy client",
    tool: "Twilio SMS · Google Business Profile",
    outcome: "5★ review posted",
    businessValue: 0,
    risk: "low",
  },
  {
    id: "aud_006",
    at: "2026-06-24T17:48:00-04:00",
    actor: "scheduling",
    action: "Prevented double-booking (Mai, Fri 1pm)",
    tool: "Google Calendar API",
    outcome: "Conflict caught, client offered 1:30pm",
    businessValue: 140,
    risk: "low",
  },
];

// ---------------------------------------------------------------------------
// Playbooks / guardrails
// ---------------------------------------------------------------------------

export const playbook: PlaybookRule[] = [
  { id: "pb_1", area: "autonomy", rule: "Answer calls & texts, book/reschedule appointments", mode: "auto" },
  { id: "pb_2", area: "autonomy", rule: "Request reviews from clients rated 5★ internally", mode: "auto" },
  { id: "pb_3", area: "autonomy", rule: "Fill open slots with inactive-client outreach", mode: "auto" },
  { id: "pb_4", area: "pricing", rule: "Offer discounts up to 10%", mode: "auto" },
  { id: "pb_5", area: "pricing", rule: "Offer discounts above 10%", mode: "approval" },
  { id: "pb_6", area: "pricing", rule: "Issue refunds over $25", mode: "approval" },
  { id: "pb_7", area: "autonomy", rule: "Send any mass text or email blast", mode: "approval" },
  { id: "pb_8", area: "autonomy", rule: "Post publicly (social, Google) on the brand", mode: "approval" },
  { id: "pb_9", area: "escalation", rule: "Reply to unhappy / sensitive customers", mode: "approval" },
  { id: "pb_10", area: "tone", rule: "Voice: warm, premium, confident — never desperate or pushy", mode: "auto" },
  { id: "pb_11", area: "tone", rule: "Never disclose it's an AI unless the customer asks directly", mode: "auto" },
  { id: "pb_12", area: "escalation", rule: "Change prices on the menu", mode: "never" },
];

// ---------------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------------

export const integrations: Integration[] = [
  { id: "int_twilio", name: "Twilio Voice & SMS", category: "Conversation", purpose: "The phone number people call & text Bossman.", status: "connected" },
  { id: "int_gcal", name: "Google Calendar", category: "Scheduling", purpose: "Read availability, book & move appointments.", status: "connected" },
  { id: "int_square", name: "Square", category: "Payments & CRM", purpose: "Customers, visit history, payments.", status: "connected" },
  { id: "int_gbp", name: "Google Business Profile", category: "Reputation", purpose: "Reviews and public replies.", status: "action_needed" },
  { id: "int_stripe", name: "Stripe", category: "Payments", purpose: "Deposits, no-show fees, gift cards.", status: "available" },
  { id: "int_qbo", name: "QuickBooks", category: "Finance", purpose: "Revenue & margin for the CFO Agent.", status: "available" },
  { id: "int_openai", name: "OpenAI", category: "AI Models", purpose: "GPT-4o / 4o-mini for fast routing & voice.", status: "connected" },
  { id: "int_anthropic", name: "Anthropic (Claude)", category: "AI Models", purpose: "Claude for planning & on-brand writing.", status: "connected" },
  { id: "int_gemini", name: "Google Gemini", category: "AI Models", purpose: "Optional model in the router.", status: "available" },
];

// Headline metrics for the home screen
export const metrics = {
  revenueRecoveredToday: 890,
  revenueRecoveredWeek: 6420,
  bookingsToday: 14,
  approvalsWaiting: approvals.length,
  hoursSaved: 11,
};
