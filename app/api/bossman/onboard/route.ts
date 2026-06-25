import { NextRequest, NextResponse } from "next/server";
import { suggestWorkspace } from "@/lib/bossman/onboard";

// POST /api/bossman/onboard
// Body: { description: string }
// Returns a WorkspaceDraft — a full Bossman configuration inferred from the
// owner's own words. Uses Claude when a key is set; heuristic otherwise.
export async function POST(req: NextRequest) {
  let description = "";
  try {
    const body = await req.json();
    description = typeof body?.description === "string" ? body.description : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (description.trim().length < 3) {
    return NextResponse.json({ error: "Tell me a bit about your business." }, { status: 400 });
  }

  const draft = await suggestWorkspace(description);
  return NextResponse.json(draft);
}
