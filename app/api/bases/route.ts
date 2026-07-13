// app/api/bases/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBases } from "@/lib/bases";
import { requireSession, requireRole, handleApiError } from "@/lib/auth";

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

    const data = await req.json();
    const base = await prisma.base.create({ data });
    return NextResponse.json(base);
  } catch (error) {
    return handleApiError(error);
  }
}
