import { NextResponse } from "next/server";
import { getDashboardCards } from "@/lib/dashboard";
import { requireSession, handleApiError } from "@/lib/auth";

// Reads the session (headers), so it must never be prerendered at build time.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const cards = await getDashboardCards(session.user.role === "SUPERADMIN" ? undefined : session.user.baseId);
    return NextResponse.json(cards);
  } catch (error) {
    return handleApiError(error);
  }
}
