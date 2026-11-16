import { NextResponse } from "next/server";
import { getDashboardCards } from "@/lib/dashboard";
import { requireSession, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const cards = await getDashboardCards(session.user.role === "SUPERADMIN" ? undefined : session.user.baseId);
    return NextResponse.json(cards);
  } catch (error) {
    return handleApiError(error);
  }
}
