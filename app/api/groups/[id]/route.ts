import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: { teens: true, base: true, activities: true, leader: true, members: { include: { teen: true } } },
  });

  if (!group) return NextResponse.json("Group not found", { status: 404 });

  return NextResponse.json(group);
}
