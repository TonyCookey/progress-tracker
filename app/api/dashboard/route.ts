import { NextResponse } from "next/server";
import { getDashboardCards } from "@/lib/dashboard";
import { requireSession, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireSession();
    const cards = await getDashboardCards();
    return NextResponse.json(cards);
  } catch (error) {
    if (error instanceof Error && error.message === "Bases not found") {
      return NextResponse.json({ error: "Bases not found" }, { status: 404 });
    }
    return handleApiError(error);
  }
}
