import { NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { normalizeGender } from "@/lib/normalizeGender";
import { Prisma } from "@prisma/client";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await requireSession();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const baseId = formData.get("baseId") as string | null;

    if (!file || !baseId) {
      return NextResponse.json({ error: "file and baseId are required" }, { status: 400 });
    }

    assertBaseAccess(session, baseId);

    const csvText = await file.text();

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json({ error: "Invalid CSV format" }, { status: 400 });
    }

    const rows = parsed.data as Array<{
      name?: string;
      gender?: string;
    }>;

    const existingTeens = await prisma.teen.findMany({
      where: { baseId, deletedAt: null },
      select: { name: true },
    });
    const existingNames = new Set(existingTeens.map((t) => t.name.trim().toLowerCase()));

    const teensToCreate = [] as Prisma.TeenCreateManyInput[];
    const skippedRows: string[] = [];
    let invalidCount = 0;

    for (const row of rows) {
      if (!row.name || !row.gender) {
        invalidCount++;
        continue;
      }

      const name = row.name.trim();
      const key = name.toLowerCase();
      if (existingNames.has(key)) {
        skippedRows.push(name);
        continue;
      }
      existingNames.add(key);

      teensToCreate.push({
        name,
        gender: normalizeGender(row.gender),
        rank: "LIEUTENANT",
        baseId,
      });
    }

    if (teensToCreate.length === 0) {
      return NextResponse.json({ message: "No valid rows to insert", skipped: skippedRows });
    }

    const result = await prisma.teen.createMany({
      data: teensToCreate,
    });

    return NextResponse.json({
      message: "Bulk upload completed",
      inserted: result.count,
      invalid: invalidCount,
      skipped: skippedRows,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
