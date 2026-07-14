import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { createNewConvertSchema } from "@/lib/validation/newConvert";
import { parseOrThrow } from "@/lib/validation/parse";
import { notDeleted } from "@/lib/softDelete";

export async function GET(req: Request) {
  try {
    const session = await requireSession();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get("limit") ?? "10") || 10));
    const search = searchParams.get("search")?.toLowerCase() ?? "";
    const requestedBaseId = searchParams.get("baseId") ?? "";
    const includeArchived = searchParams.get("includeArchived") === "true";
    const skip = (page - 1) * limit;

    // Non-SUPERADMIN users may only ever list their own base's records, regardless
    // of what baseId (or none) the request asks for.
    const baseId = session.user.role === "SUPERADMIN" ? requestedBaseId : session.user.baseId;

    const where = {
      baseId: baseId ? baseId : undefined,
      name: { contains: search, mode: "insensitive" as const },
      ...notDeleted(includeArchived),
    };

    const [data, total] = await Promise.all([
      prisma.newConvert.findMany({
        where,
        include: { base: true },
        skip,
        take: limit,
        orderBy: { date: "desc" },
      }),
      prisma.newConvert.count({ where }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = parseOrThrow(createNewConvertSchema, await req.json());

    const isCrossBase = body.isCrossBase ?? false;
    const baseId = isCrossBase ? null : body.baseId;
    assertBaseAccess(session, isCrossBase ? null : baseId);

    const newConvert = await prisma.newConvert.create({
      data: {
        name: body.name,
        gender: body.gender,
        phone: body.phone,
        dateOfBirth: body.dateOfBirth,
        baseId,
        isCrossBase,
        date: body.date,
        activityId: body.activityId,
        invitedBy: body.invitedBy,
        followedUp: body.followedUp,
        becameTeen: body.becameTeen,
        teenId: body.teenId,
        notes: body.notes,
      },
    });

    return NextResponse.json(newConvert);
  } catch (error) {
    return handleApiError(error);
  }
}
