import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/auth";
import { parseOrThrow } from "@/lib/validation/parse";
import { updateBaseSchema } from "@/lib/validation/base";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["SUPERADMIN"]);

    const data = parseOrThrow(updateBaseSchema, await req.json());
    const base = await prisma.base.update({ where: { id: params.id }, data });
    return NextResponse.json(base);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return handleApiError(new ApiError(400, "A base with this name already exists"));
    }
    return handleApiError(error);
  }
}
