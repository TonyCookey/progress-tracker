const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  // --- Find Bases ---

  const alpha = await prisma.base.findFirst({ where: { name: "Alpha" } });
  const bravo = await prisma.base.findFirst({ where: { name: "Bravo" } });

  // --- Create Admins ---
  const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

  await prisma.user.create({
    data: {
      name: "General Serrano",
      email: "gs@davidsarmy.com.ng",
      username: "GS",
      password,
      dateOfBirth: new Date("1990-01-01"),
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
  console.log("✅ Seeding Admins complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
