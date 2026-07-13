import { NextResponse } from "next/server";
import { getDashboardCards } from "@/lib/dashboard";
import { requireSession, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireSession();
    const cards = await getDashboardCards();
    return NextResponse.json(cards);
  } catch (error) {
    return handleApiError(error);
  }
}
