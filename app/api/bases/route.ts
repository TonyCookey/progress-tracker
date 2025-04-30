// app/api/bases/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("[BASES_GET]");
    const bases = await prisma.base.findMany({});
    console.log("[BASES_GET_SUCCESS]", bases);

    return NextResponse.json({ bases });
  } catch (error) {
    console.log("[BASES_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch bases" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const base = await prisma.base.create({ data });
    return NextResponse.json(base);
  } catch (error) {
    console.log("[BASES_POST_ERROR]", error);
    return NextResponse.json({ error: "Failed to create base" }, { status: 500 });
  }
}
