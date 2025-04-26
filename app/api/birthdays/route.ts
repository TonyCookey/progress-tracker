// src/app/api/birthdays/route.ts
import { NextResponse } from "next/server";
import { getUpcomingBirthdays } from "@/lib/getUpcomingBirthdays";

export async function GET() {
  try {
    const birthdays = await getUpcomingBirthdays();
    return NextResponse.json(birthdays);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
