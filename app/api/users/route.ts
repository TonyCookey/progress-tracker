import { NextResponse } from "next/server";
import { getUsers } from "@/lib/users";
import { requireSession, handleApiError } from "@/lib/auth";

export async function GET() {
  try {
    await requireSession();
    const users = await getUsers();
    return NextResponse.json(users);
  } catch (error) {
    return handleApiError(error);
  }
}
