import { NextRequest, NextResponse } from "next/server";
import { converse, Turn } from "@/lib/bossman/converse";

// POST /api/bossman/converse
// Body: { message: string, history?: { role: "owner"|"bossman", text: string }[] }
// The live, multi-turn conversational brain behind the console.
export async function POST(req: NextRequest) {
  let message = "";
  let history: Turn[] = [];
  try {
    const body = await req.json();
    message = typeof body?.message === "string" ? body.message : "";
    if (Array.isArray(body?.history)) {
      history = body.history
        .filter((t: any) => t && (t.role === "owner" || t.role === "bossman") && typeof t.text === "string")
        .slice(-10) // keep the last few turns for context
        .map((t: any) => ({ role: t.role, text: String(t.text).slice(0, 500) }));
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!message.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const result = await converse(message, history);
  return NextResponse.json(result);
}
