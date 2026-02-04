import { NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { normalizeGender } from "@/lib/normalizeGender";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const baseId = formData.get("baseId") as string | null;

    if (!file || !baseId) {
      return NextResponse.json({ error: "file and baseId are required" }, { status: 400 });
    }

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

    const teensToCreate = [] as Prisma.TeenCreateManyInput[];
    let skipped = 0;

    for (const row of rows) {
      if (!row.name || !row.gender) {
        skipped++;
        continue;
      }

      teensToCreate.push({
        name: row.name.trim(),
        gender: normalizeGender(row.gender),
        rank: "LIEUTENANT",
        baseId,
      });
    }

    if (teensToCreate.length === 0) {
      return NextResponse.json({ message: "No valid rows to insert" }, { status: 200 });
    }

    const result = await prisma.teen.createMany({
      data: teensToCreate,
      skipDuplicates: true,
    });

    return NextResponse.json({
      message: "Bulk upload completed",
      inserted: result.count,
      skipped,
    });
  } catch (error) {
    console.error("Bulk teen upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
