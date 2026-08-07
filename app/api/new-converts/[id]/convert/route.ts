import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, assertBaseAccess, handleApiError, ApiError } from "@/lib/auth";
import { createTeenSchema } from "@/lib/validation/teen";
import { parseOrThrow } from "@/lib/validation/parse";
import { notDeleted } from "@/lib/softDelete";
import { assertGroupsInBase } from "@/lib/validateBaseRefs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const data = parseOrThrow(createTeenSchema, await req.json());

    const newConvert = await prisma.newConvert.findFirst({ where: { id: params.id, ...notDeleted(false) } });
    if (!newConvert) {
      return NextResponse.json({ error: "New convert not found" }, { status: 404 });
    }
    if (newConvert.becameTeen) {
      throw new ApiError(409, "This new convert has already been converted to a teen");
    }

    assertBaseAccess(session, newConvert.isCrossBase ? null : newConvert.baseId);
    assertBaseAccess(session, data.baseId);

    await assertGroupsInBase(data.groupId ? [data.groupId] : [], data.baseId, "groupId");
    await assertGroupsInBase(data.squadIds ?? [], data.baseId, "squadIds");

    const { squadIds = [], ...teenData } = data;

    const [teen] = await prisma.$transaction(async (tx) => {
      const createdTeen = await tx.teen.create({
        data: {
          ...teenData,
          // Match the normal teen-create default so a converted teen isn't left
          // with a null dateJoined (which would drop them from the membership-
          // growth trend, which filters on dateJoined).
          dateJoined: teenData.dateJoined ?? new Date(),
          squadMemberships: {
            create: squadIds.map((id: string) => ({ group: { connect: { id } } })),
          },
        },
      });

      await tx.newConvert.update({
        where: { id: params.id },
        data: { becameTeen: true, teenId: createdTeen.id },
      });

      return [createdTeen];
    });

    return NextResponse.json(teen);
  } catch (error) {
    return handleApiError(error);
  }
}
