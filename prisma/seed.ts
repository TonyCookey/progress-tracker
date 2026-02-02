import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // --- Create Bases ---
  const alpha = await prisma.base.create({ data: { name: "Alpha" } });
  const bravo = await prisma.base.create({ data: { name: "Bravo" } });

  // --- Create Users ---
  const password = await bcrypt.hash("password123", 10);

  await prisma.user.create({
    data: {
      name: "General Serrano",
      email: "gs@davidsarmy.com.ng",
      username: "GS",
      password,
      dateOfBirth: new Date("1990-11-26"),
      role: "SUPERADMIN",
      baseId: alpha.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Colonel Tony",
      email: "ct@davidsarmy.com.ng",
      username: "CT",
      password,
      dateOfBirth: new Date("1997-12-27"),
      role: "SUPERADMIN",
      baseId: bravo.id,
    },
  });

  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
