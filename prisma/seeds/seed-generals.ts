const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  // --- Create Bases ---
  const alpha = await prisma.base.create({ data: { name: "Alpha" } });
  const bravo = await prisma.base.create({ data: { name: "Bravo" } });

  // --- Create Users ---
  const password = await bcrypt.hash("password123", 10);

  const generalRuth = await prisma.user.create({
    data: {
      name: "General Ruth",
      email: "gr@davidsarmy.com.ng",
      username: "GR",
      password,
      dateOfBirth: new Date("1994-01-26"),
      role: "SUPERADMIN",
      baseId: bravo.id,
    },
  });

  const colonelTony = await prisma.user.create({
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
  console.log("✅ Seeding Generals complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
