// Bossman domain types.
// These mirror the production data model documented in /docs/DATA_MODEL.md.
// In the real build these are Postgres tables (via Supabase/Prisma); here they
// back the clickable MVP with seeded data.

export type WorkerType =
  | "front_desk"
  | "sales_followup"
  | "reputation"
  | "cfo"
  | "marketing"
  | "scheduling"
  | "support"
  | "operations";

export type RiskLevel = "low" | "medium" | "high";

export type Channel = "voice" | "sms" | "voice_note" | "dashboard";

export type ApprovalKind =
  | "discount"
  | "refund"
  | "public_post"
  | "mass_text"
  | "sensitive_reply";

export type TaskStatus =
  | "queued"
  | "running"
  | "waiting_approval"
  | "done"
  | "blocked";

export interface Service {
  id: string;
  name: string;
  price: number;
  durationMin: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  lastVisit: string; // ISO date
  lifetimeValue: number;
  usualService: string;
}

export interface Business {
  id: string;
  name: string;
  niche: string;
  timezone: string;
  phone: string;
  services: Service[];
  staff: StaffMember[];
}

export interface Worker {
  type: WorkerType;
  title: string;
  blurb: string;
  status: "idle" | "working" | "needs_input";
  model: string; // which AI model/tool Bossman routed to
  currentTask?: string;
  tasksToday: number;
  roiToday: number; // $ attributed
  risk: RiskLevel;
}

export interface PlanStep {
  id: string;
  worker: WorkerType;
  title: string;
  detail: string;
  model: string;
  requiresApproval: boolean;
  risk: RiskLevel;
  status: TaskStatus;
  roiEstimate?: number;
}

export interface ActionPlan {
  id: string;
  conversationId: string;
  goal: string;
  constraints: string[];
  status: "drafting" | "active" | "awaiting_approval" | "complete";
  createdAt: string;
  steps: PlanStep[];
}

export interface ConversationTurn {
  role: "owner" | "bossman";
  text: string;
}

export interface Conversation {
  id: string;
  channel: Channel;
  participant: string;
  startedAt: string;
  durationLabel: string;
  summary: string;
  decisions: string[];
  followUps: string[];
  transcript: ConversationTurn[];
}

export interface Approval {
  id: string;
  kind: ApprovalKind;
  worker: WorkerType;
  title: string;
  body: string;
  reason: string;
  risk: RiskLevel;
  valueAtStake: number;
  requestedAt: string;
  preview?: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: "bossman" | WorkerType;
  action: string;
  tool: string;
  outcome: string;
  businessValue: number;
  risk: RiskLevel;
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  purpose: string;
  status: "connected" | "available" | "action_needed";
}

export interface PlaybookRule {
  id: string;
  area: "autonomy" | "pricing" | "tone" | "escalation";
  rule: string;
  mode: "auto" | "approval" | "never";
}

export const WORKER_META: Record<WorkerType, { title: string; emoji: string }> = {
  front_desk: { title: "Front Desk Agent", emoji: "📞" },
  sales_followup: { title: "Sales Follow-Up Agent", emoji: "💬" },
  reputation: { title: "Reputation Agent", emoji: "⭐" },
  cfo: { title: "CFO Agent", emoji: "📊" },
  marketing: { title: "Marketing Agent", emoji: "📣" },
  scheduling: { title: "Scheduling Agent", emoji: "📅" },
  support: { title: "Customer Support Agent", emoji: "🤝" },
  operations: { title: "Operations Agent", emoji: "⚙️" },
};
