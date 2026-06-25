import { RiskLevel, WorkerType } from "./types";

// The Bossman Console is driven by a scripted "beat sheet". Each beat is one
// thing Bossman does after the owner talks: think, ask, plan, delegate, gate an
// approval, or report. This is the heart of the demo — conversation → action.
//
// In production these beats are emitted as real events by the orchestrator
// (see /docs/ARCHITECTURE.md). Here they're scripted so the magic moment is
// reproducible in a click-through.

export type Beat =
  | { kind: "say"; text: string } // Bossman speaks (conversational)
  | { kind: "think"; text: string } // ephemeral "working…" line
  | { kind: "ask"; text: string; chips: string[] } // clarifying question + quick replies
  | { kind: "plan_open"; goal: string; constraints: string[] }
  | {
      kind: "delegate";
      worker: WorkerType;
      title: string;
      model: string;
      detail: string;
      risk: RiskLevel;
    }
  | {
      kind: "approval";
      title: string;
      preview: string;
      reason: string;
    }
  | { kind: "report"; lines: string[] };

export interface Script {
  // What the owner "said" to kick this off (prefilled, editable in the UI).
  ownerOpener: string;
  // Quick-start suggestions shown under the composer.
  suggestions: string[];
  beats: Beat[];
}

export const frenchNailScript: Script = {
  ownerOpener:
    "Hey Bossman, we're slow tomorrow and Friday. Can you get more people booked without sounding desperate? Don't go above 10% off unless I approve it.",
  suggestions: [
    "We're slow Thu & Fri — fill the chairs, max 10% off",
    "A regular left unhappy, take care of her",
    "Plan a classy weekend promo",
  ],
  beats: [
    {
      kind: "think",
      text: "Reading your calendar, customer list, and tone rules…",
    },
    {
      kind: "say",
      text: "Got it. I'll check openings, find inactive customers who usually book on weekdays, draft a friendly rebooking campaign under your 10% limit, and send it to you for approval before anything goes out.",
    },
    {
      kind: "ask",
      text: "Do you want to prioritize lashes, nails, or both?",
      chips: ["Both", "Lashes", "Nails"],
    },
    {
      kind: "say",
      text: "Both it is — and I'll keep it classy, nothing that sounds desperate. Here's my plan.",
    },
    {
      kind: "plan_open",
      goal: "Fill Thursday & Friday without sounding desperate (discounts ≤ 10%).",
      constraints: [
        "Max 10% off without your approval",
        "Warm, premium tone — never desperate",
        "You approve the text before it sends",
      ],
    },
    {
      kind: "delegate",
      worker: "scheduling",
      title: "Map open slots Thu–Fri",
      model: "GPT-4o · Google Calendar",
      detail: "11 openings across Mai (lashes) and Tran (nails).",
      risk: "low",
    },
    {
      kind: "delegate",
      worker: "cfo",
      title: "Find weekday-leaning inactive clients",
      model: "GPT-4o · Square",
      detail: "38 clients who usually book Mon–Fri, quiet 35+ days.",
      risk: "low",
    },
    {
      kind: "delegate",
      worker: "sales_followup",
      title: "Draft the rebooking text",
      model: "Claude Opus 4.8",
      detail: "Warm 'midweek touch-up' message with a soft 10% incentive.",
      risk: "medium",
    },
    {
      kind: "approval",
      title: "Send rebooking text to 38 clients?",
      preview:
        "Hi {{first}}, it's French Nail & Lashes 💅 We saved a couple of midweek spots this Thu/Fri and thought of you. Treat yourself to a fresh set — 10% off if you book by tonight. Reply YES and I'll find your time!",
      reason: "Mass texts always need your sign-off. Projected: +$1,240 this week.",
    },
    {
      kind: "say",
      text: "Approved — sending now. I'll have Front Desk handle the replies and book them straight into the calendar. I'll only ping you if someone needs a real decision.",
    },
    {
      kind: "report",
      lines: [
        "Sent to 38 clients · 9 replied YES so far",
        "6 booked into Thu/Fri (Front Desk handled it)",
        "+$680 booked · ~$74 discount cost",
        "Tonight I'll text you the final tally",
      ],
    },
  ],
};
