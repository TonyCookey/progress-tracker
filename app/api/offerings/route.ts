import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");
  const search = searchParams.get("search")?.toLowerCase() ?? "";
  const baseId = searchParams.get("baseId") ?? "";

  const skip = (page - 1) * limit;

  const [offerings, total] = await Promise.all([
    await prisma.offering.findMany({
      where: {
        service: {
          contains: search,
          mode: "insensitive",
        },
        baseId: baseId ? baseId : undefined,
      },
      skip,
      take: limit,
      orderBy: { date: "desc" },
    }),
    await prisma.offering.count({
      where: {
        service: {
          contains: search,
          mode: "insensitive",
        },
        baseId: baseId ? baseId : undefined,
      },
    }),
  ]);
  return NextResponse.json({ offerings, total });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { service, amount, date, notes, type, baseId } = body;

  const offering = await prisma.offering.create({
    data: {
      service,
      amount: parseFloat(amount),
      date: new Date(date),
      //   notes,
      //   type,
      baseId,
    },
  });

  return NextResponse.json(offering);
}
