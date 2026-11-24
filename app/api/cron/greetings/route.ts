import { NextResponse } from "next/server";
import { sendTodaysGreetings } from "@/lib/greetings";
import { handleApiError } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Called daily by Vercel Cron (see vercel.json). Vercel sends
// `Authorization: Bearer $CRON_SECRET` when the CRON_SECRET env var is set.
// /api/cron is public in middleware (matcher only covers /dashboard + /auth/register),
// so the secret is the only gate — fail closed if it isn't configured.
export async function GET(req: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await sendTodaysGreetings();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
