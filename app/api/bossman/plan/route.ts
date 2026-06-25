import { NextRequest, NextResponse } from "next/server";
import { buildPlan } from "@/lib/bossman/planner";

// POST /api/bossman/plan
// Body: { message: string }
// Returns a structured BossmanPlan with each step's model chosen live by the
// router. This is the production seam: swap buildPlan's heuristic for an LLM
// call and nothing else in the stack changes.
export async function POST(req: NextRequest) {
  let message = "";
  try {
    const body = await req.json();
    message = typeof body?.message === "string" ? body.message : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!message.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const plan = await buildPlan(message);
  return NextResponse.json(plan);
}
