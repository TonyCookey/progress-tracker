import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHouseholds } from "@/lib/households";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { createHouseholdSchema } from "@/lib/validation/household";
import { parseOrThrow } from "@/lib/validation/parse";

export async function GET(req: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const households = await getHouseholds(includeArchived);
    return NextResponse.json(households);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const data = parseOrThrow(createHouseholdSchema, await req.json());
    assertBaseAccess(session, data.baseId);

    const household = await prisma.household.create({
      data: {
        name: data.name,
        address: data.address ?? undefined,
        primaryContactName: data.primaryContactName ?? undefined,
        primaryContactPhone: data.primaryContactPhone ?? undefined,
        baseId: data.baseId ?? undefined,
      },
    });

    return NextResponse.json(household);
  } catch (error) {
    return handleApiError(error);
  }
}
