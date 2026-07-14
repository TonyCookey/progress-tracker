import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { createActivitySchema } from "@/lib/validation/activity";
import { parseOrThrow } from "@/lib/validation/parse";
import { notDeleted } from "@/lib/softDelete";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = parseOrThrow(createActivitySchema, await req.json());
    const { name, description, type, date, platoonId, squadIds } = body;

    const isCrossBase = body.baseId === "cross-base" ? true : body.isCrossBase;
    const baseId = isCrossBase ? null : body.baseId;

    if (!isCrossBase) {
      assertBaseAccess(session, baseId);
    } else if (session.user.role !== "SUPERADMIN") {
      assertBaseAccess(session, null);
    }

    // Collect all group IDs
    const groupIds: string[] = [];

    if (platoonId) groupIds.push(platoonId);
    if (Array.isArray(squadIds)) groupIds.push(...squadIds);

    const activity = await prisma.activity.create({
      data: {
        name,
        description: description ?? undefined,
        type,
        date,
        baseId,
        isCrossBase,
        groups: {
          connect: groupIds.map((id) => ({ id })),
        },
      },
      include: {
        groups: true,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireSession();

    const { searchParams } = new URL(req.url);
    const baseId = searchParams.get("baseId");
    const includeArchived = searchParams.get("includeArchived") === "true";

    const activities = await prisma.activity.findMany({
      where: { ...(baseId ? { baseId } : {}), ...notDeleted(includeArchived) },
      include: {
        base: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(activities);
  } catch (error) {
    return handleApiError(error);
  }
}
