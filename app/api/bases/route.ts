// app/api/bases/route.ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getBases } from "@/lib/bases";
import { requireSession, requireRole, handleApiError, ApiError } from "@/lib/auth";
import { parseOrThrow } from "@/lib/validation/parse";
import { createBaseSchema } from "@/lib/validation/base";

export async function GET() {
  try {
    await requireSession();
    const bases = await getBases();

    return NextResponse.json(bases);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(["SUPERADMIN"]);

    const data = parseOrThrow(createBaseSchema, await req.json());
    const base = await prisma.base.create({ data });
    return NextResponse.json(base);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return handleApiError(new ApiError(400, "A base with this name already exists"));
    }
    return handleApiError(error);
  }
}
