import { NextResponse } from "next/server";
import { getUsers } from "@/lib/users";
import { requireSession, handleApiError } from "@/lib/auth";

// Reads the session (headers), so it must never be prerendered at build time.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
    const users = await getUsers();
    return NextResponse.json(users);
  } catch (error) {
    return handleApiError(error);
  }
}
