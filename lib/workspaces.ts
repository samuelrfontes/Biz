import { WorkerType } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// MULTI-TENANT WORKSPACES
//
// Bossman is one operator deployed to many owners. Every account is a
// Workspace with its own profile, goals, tone, guardrails, enabled workers,
// and (over time) its own evolved agent brains. French Nail & Lashes is just
// the first of many — the same engine adapts to a law office, a Shopify brand,
// a contractor, a clinic. Onboarding fills this in; nothing is niche-coded.
// ─────────────────────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  /** Free-text — onboarding asks "what do you do?" and Bossman configures
   *  itself from the answer. Not an enum; the product is not niche-locked. */
  kind: string;
  emoji: string;
  /** The owner's own words about what they want Bossman to handle. */
  mandate: string;
  toneWords: string[];
  /** Which workers Bossman activates for this tenant (others stay dormant). */
  enabledWorkers: WorkerType[];
  /** A representative win, for the "network" view. */
  signatureWin: string;
  active?: boolean;
}

export const workspaces: Workspace[] = [
  {
    id: "ws_french_nail",
    name: "French Nail & Lashes",
    kind: "Nail & lash studio",
    emoji: "💅",
    mandate: "Keep the chairs full and clients loyal without me on my phone all day.",
    toneWords: ["warm", "premium", "never desperate"],
    enabledWorkers: ["front_desk", "scheduling", "sales_followup", "reputation", "cfo", "marketing"],
    signatureWin: "Recovered $6.4k in slow-week bookings last month",
    active: true,
  },
  {
    id: "ws_hartwell_law",
    name: "Hartwell Law",
    kind: "Solo attorney",
    emoji: "⚖️",
    mandate: "Screen new client inquiries, book consults, and never miss a deadline.",
    toneWords: ["professional", "precise", "reassuring"],
    enabledWorkers: ["front_desk", "scheduling", "support", "operations", "cfo"],
    signatureWin: "Intake response time 6 hrs → 4 min; +18 consults booked",
  },
  {
    id: "ws_lumen_goods",
    name: "Lumen Goods",
    kind: "E-commerce brand",
    emoji: "🛍️",
    mandate: "Handle support, recover abandoned carts, and keep reviews glowing.",
    toneWords: ["upbeat", "on-brand", "helpful"],
    enabledWorkers: ["support", "sales_followup", "reputation", "marketing", "cfo", "operations"],
    signatureWin: "Cart recovery up 23%; first-response on tickets under 2 min",
  },
  {
    id: "ws_castillo_contracting",
    name: "Castillo Contracting",
    kind: "Home-service contractor",
    emoji: "🔨",
    mandate: "Answer every lead fast, quote jobs, and schedule crews tightly.",
    toneWords: ["straightforward", "trustworthy", "no-nonsense"],
    enabledWorkers: ["front_desk", "scheduling", "sales_followup", "operations", "cfo"],
    signatureWin: "Captured 31 after-hours leads competitors missed",
  },
  {
    id: "ws_brightsmile",
    name: "BrightSmile Dental",
    kind: "Dental practice",
    emoji: "🦷",
    mandate: "Fill last-minute cancellations and keep recall patients coming back.",
    toneWords: ["caring", "clean", "professional"],
    enabledWorkers: ["front_desk", "scheduling", "support", "reputation", "operations"],
    signatureWin: "Cut empty-chair time 40% by filling cancellations same-day",
  },
];

export const activeWorkspace = workspaces.find((w) => w.active)!;

export const networkStats = {
  businesses: 1280,
  conversationsHandled: 412_900,
  revenueInfluenced: 9_400_000,
  avgEvolutionWeeks: 6,
};
