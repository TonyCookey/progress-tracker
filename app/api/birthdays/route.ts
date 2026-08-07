// src/app/api/birthdays/route.ts
import { NextResponse } from "next/server";
import { getUpcomingBirthdays } from "@/lib/getUpcomingBirthdays";
import { requireSession, handleApiError } from "@/lib/auth";

export async function GET() {
  try {
    await requireSession();
    const birthdays = await getUpcomingBirthdays();
    return NextResponse.json(birthdays);
  } catch (error) {
    return handleApiError(error);
  }
}
