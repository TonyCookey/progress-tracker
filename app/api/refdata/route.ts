import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, handleApiError, ApiError } from "@/lib/auth";
import { parseOrThrow } from "@/lib/validation/parse";
import { createRefDataSchema } from "@/lib/validation/refdata";
import { getRefData, slugifyKey } from "@/lib/refdata";

export async function GET(req: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    if (!category) {
      throw new ApiError(400, "category query param is required");
    }
    const includeInactive = searchParams.get("includeInactive") === "true";

    const items = await getRefData(category, includeInactive);
    return NextResponse.json(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(["SUPERADMIN"]);

    const data = parseOrThrow(createRefDataSchema, await req.json());
    const key = data.key || slugifyKey(data.label);
    if (!key) {
      throw new ApiError(400, "Could not derive a key from the given label");
    }

    const existing = await prisma.refData.findUnique({
      where: { category_key: { category: data.category, key } },
    });

    if (existing) {
      if (existing.active) {
        throw new ApiError(400, "This value already exists in this category");
      }
      // Previously "deleted" (deactivated) row occupying this (category, key) slot — reactivate it
      // instead of colliding on the unique constraint.
      const reactivated = await prisma.refData.update({
        where: { id: existing.id },
        data: { label: data.label, active: true, ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}) },
      });
      return NextResponse.json(reactivated);
    }

    let sortOrder = data.sortOrder;
    if (sortOrder === undefined) {
      const last = await prisma.refData.findFirst({
        where: { category: data.category },
        orderBy: { sortOrder: "desc" },
      });
      sortOrder = (last?.sortOrder ?? -1) + 1;
    }

    const item = await prisma.refData.create({
      data: {
        category: data.category,
        key,
        label: data.label,
        sortOrder,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    return handleApiError(error);
  }
}
